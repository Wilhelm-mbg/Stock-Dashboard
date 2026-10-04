# ZUSATZ — Messung „Sektor-Momentum": was REGEL.md offenlässt, vor dem ersten Kurs festgelegt (05.10.2026)

Kennung `sektor-momentum-messung-2026-10/v1`. Gemessen wird die Regel `kandidaten-blind-2026-10/sektor-momentum/v1`
(`studien/kandidaten-blind-2026-10/sektor-momentum/REGEL.md`, `ziel.js`, `test.js` aus Commit `c903255`, ohne Kursdaten geschrieben).
REGEL.md wird **nicht** geändert: der Ordner kommt per Merge von `c903255` in diesen Zweig, `git diff c903255 HEAD -- studien/kandidaten-blind-2026-10/sektor-momentum/`
ist leer. Diese Datei legt nur fest, was die REGEL offenlässt, und benennt, wo der Auftrag vom 05.10.2026 etwas anderes vorgibt („Abweichung durch den Auftrag").
Sie wird zusammen mit dem Ladeskript `laden.js` committet, **bevor ein einziger Kurs geladen ist** (Siegel 1); der Commit-Zeitpunkt belegt die Reihenfolge.
Danach wird an ihr nichts geändert. Ein Fehler im Code wird benannt, behoben, der Lauf wiederholt und in `ergebnis.json` unter `korrekturen` vermerkt.
Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

## 1. Daten

1. **Quelle (Abweichung durch den Auftrag).** REGEL A.6 nennt SPY aus dem Tages-Panel und Ausschüttungen aus dem Maßnahmen-Archiv; Teil C.2 verlangt für die
   Sektor-Fonds eine Quelle „vor dem Siegel". Der Auftrag gibt für **alle zwölf Reihen** dieselbe Quelle vor: die öffentliche Yahoo-Chart-Schnittstelle,
   `https://query1.finance.yahoo.com/v8/finance/chart/<KÜRZEL>?interval=1d&events=div,splits&period1=912470400&period2=1789516800`
   (01.12.1998 00:00 UTC bis 16.09.2026 00:00 UTC, letzter Balken 15.09.2026), bei einem Fehler derselbe Pfad auf `query2`. Kürzel:
   `XLB, XLC, XLE, XLF, XLI, XLK, XLP, XLRE, XLU, XLV, XLY, SPY`. Buch und Maßstab kommen damit aus derselben Quelle; die Bindung an die bekannten
   Panel-Zahlen leistet die Pflichtprüfung (§1.9). Die Quelle wird nach dem Blick auf Erträge **nicht** gewechselt.
2. **Ablage.** Die Antworten werden unverändert gespeichert, **außerhalb des Repos** (Daten Dritter, öffentliches Repo): Ordner aus der Umgebungsvariablen
   `SEKTOR_DATEN`, Vorgabe `C:/Users/Wilhe/Downloads/sektor-messung/daten`, je Kürzel `<KÜRZEL>.json`. Ins Repo kommen nur `laden.js` und
   `pruefsummen.json` (SHA-256 der Datei, Größe, Zeilenzahl, erster und letzter Tag, Zahl der Ausschüttungen und Splits, Ladezeit, Adresse).
3. **Einmal laden.** Ein Ladevorgang; danach gelten die Dateien mit diesen Prüfsummen. Neu geladen wird nur bei einem technischen Fehler (leer, abgeschnitten,
   Klinke in §1.4), mit Begründung und beiden Prüfsummen in `ergebnis.json` — nie nach einem Blick auf Erträge.
4. **Abnahme je Datei (Klinken in `laden.js`).** HTTP 200; `chart.error` leer; `meta.symbol` = Kürzel; `timestamp` nicht leer; `open, close, volume` und
   `adjclose` gleich lang wie `timestamp`; letzter Tag 15.09.2026. Sonst wird die Antwort verworfen und neu angefragt (höchstens drei Versuche je Kürzel,
   abwechselnd `query1`/`query2`); gelingt es nicht, endet das Laden mit Fehler und es gibt keinen Lauf.
5. **Tagesbildung.** Datum eines Balkens = Kalendertag des Zeitstempels in `America/New_York`; Zeitstempel der Zeile = Mitternacht UTC dieses Tages
   (REGEL C.9). Ein Balken ohne gültigen Schluss oder ohne gültiges `adjclose` (fehlt oder ≤ 0) entfällt und wird gezählt. Zwei Balken mit demselben Datum:
   sind sie gleich, zählt einer; sonst gilt der letzte in der Antwort, der Fall wird gezählt und berichtet.
6. **Kalender der Handelstage** (die „Panel-Handelstage" der REGEL) = die Tage der SPY-Reihe. Klinken vor jedem Lauf: Fenster A 04.01.2017–15.09.2021 hat
   **1.183**, Fenster B 16.09.2021–15.09.2026 **1.254** Handelstage; 03.01.2017 ist der Handelstag vor dem 04.01.2017, 15.09.2021 der vor dem 16.09.2021.
   Zeilen eines Fonds an Tagen ohne SPY-Zeile bleiben Zeilen der Reihe (Länge, Rückblick, Umsatz), sind aber kein Handels- oder Bewertungstag (gezählt, Erwartung 0).
7. **Welche Größe wofür.**
   - **Rangbildung** (REGEL A.1–A.3, `zielfunktion`/`placeboZiel` aus `ziel.js` unverändert): Zeile `[Zeitstempel, adjclose, close × volume / adjclose]`.
     Der Kurs ist der um Splits **und** Ausschüttungen bereinigte Schluss — REGEL A.2 („Gesamtrendite", „bereinigte Schlusskurse") und C.2 („mit
     Splits/Ausschüttungen bereinigt"). Die Stückzahl ist so gewählt, dass Kurs × Stück = `close × volume` = Dollar-Umsatz des Tages ist (wie die `rohMap` der
     Grundregel: `umsatz / bSchluss`); so misst die Umsatzschwelle Dollar, nicht bereinigte Dollar. Fehlt `volume`, ist die Stückzahl `null`. Übergeben werden je
     Fonds die letzten 253 Zeilen bis einschließlich Stichtag (wie `rohMapAm` der Grundregel; gleichwertig zur ganzen Reihe bis zum Stichtag, ein Test vergleicht
     beides). `nowMs` = Zeitstempel des Stichtags. Kein Blick voraus: Yahoos Rückwärtsbereinigung multipliziert alle früheren Kurse mit denselben Faktoren und
     ändert das Verhältnis Schluss(Stichtag) / Schluss(Stichtag − 252 Zeilen) durch spätere Ausschüttungen nicht.
   - **Handel** zur Eröffnung des Ausführungstags: `open` (split-, nicht ausschüttungsbereinigt). Fehlt `open` oder ist ≤ 0, hat der Fonds an diesem Tag keinen
     Eröffnungskurs: ein Ziel wird nicht gehandelt, sein Anteil bleibt Bargeld; eine Position wird gehalten (REGEL C.7, `gleichgewicht`).
   - **Bewertung** zum Schluss: `close`; fehlt die Zeile eines gehaltenen Fonds, gilt sein letzter Schluss (nie der Einstand).
   - **Ausschüttungen**: `events.dividends` (Betrag, Ex-Tag = New-Yorker Datum des Ereignisses), mit der Formel der Grundregel: `satz = Betrag / close des
     Vortags` (letzte Zeile der Reihe vor dem Ex-Tag), `basis = close des Vortags`. Buch: Anspruch nach der Stückzahl über die Nacht vor dem Ex-Tag
     (Stückzahl vor dem Handel des Tages, gehalten seit einem früheren Tag), Gutschrift `Stück × basis × satz` als Bargeld **nach** dem Handel des Tages, angelegt
     mit der nächsten Umschichtung. SPY: Ex-Tage nach dem Kauftag, Wiederanlage am Ex-Tag zum Schluss. Ein Ex-Tag ohne Handelstag wird am ersten Handelstag
     danach gebucht; Beträge ≤ 0 und Ex-Tage nach der letzten Zeile zählen nicht; mehrere Sätze an einem Tag zählen alle.
8. **Splits.** Yahoo liefert Kurse und Ausschüttungsbeträge split-bereinigt; die Stückzahlen im Buch sind damit bereinigte Stück, ein Split ändert weder Stück
   noch Wert. Die Datenprüfung (§1.10) hält jeden Satz Betrag / Vortagesschluss gegen 0,01 % bis 5 %; Sätze außerhalb werden einzeln berichtet, nicht gefiltert.
   Liegt ein Split in den Daten und springt der Satz einer Reihe genau um den Splitfaktor, wird das als Quellfehler berichtet; die Rechnung bleibt bei den
   gelieferten Werten, das Urteil trägt dann den Vermerk.
9. **SPY: Ergänzung und Pflichtprüfung (REGEL A.6, C.1).** Führt Yahoo für SPY einen Satz mit Ex-Tag 15.06.2018, gilt Yahoos Betrag; sonst wird
   `{ ex_date: '2018-06-15', rate: 1.2456 }` ergänzt (benannte Konstante, höchstens ein Satz je Ex-Tag). Klinken: SPY hat nach dem ersten Fenstertag bis zum
   letzten **18** Ex-Tage in A und **20** in B, in jedem Kalenderjahr 2017–2025 vier. **Pflichtprüfung** gegen die bekannten SPY-Zahlen (Panel plus
   Maßnahmen-Archiv mit Ergänzung, Nr. 78, `studien/momentum-korb-2026-10-04/ergebnis.json`):
   (i) Schluss 03.01.2017 → Schluss 15.09.2021 mit Wiederanlage +115,95 %; (ii) Kauf zur Eröffnung 04.01.2017 → Schluss 15.09.2021: 215.535,73 $ (+115,54 %);
   (iii) Eröffnung 16.09.2021 → Schluss 15.09.2026: 181.193,87 $ (+81,19 %); (iv) Summe der Ausschüttungen je Anteil in A 23,8656 $, in B 34,0657 $.
   Toleranz: (i)–(iii) höchstens 0,30 Pp Gesamtertrag, (iv) höchstens 0,01 $. Wird eine verfehlt, gibt es keinen Lauf, bis die Ursache gefunden und berichtet ist.
10. **Datenprüfung (nur Bericht, ändert keine Zahl).** Je Reihe: Zeilen, erster/letzter Tag, Lücken gegen den SPY-Kalender (fehlende Tage, Tage ohne `open`, ohne
    `volume`), Splits, Ausschüttungen je Kalenderjahr und ihre Sätze, Abgleich `adjclose` gegen `close` + Ausschüttungen (jede Stufe des Faktors
    `adjclose / close` muss eine Ausschüttung oder ein Split sein und umgekehrt), Gesamtertrag je Fenster aus `adjclose` gegen `close` + Ausschüttungen
    (Wiederanlage am Ex-Tag zum Schluss), zweite Quelle für Ausschüttungen ab 2016 (`E:/Markt-Dashboard-Archiv/alpaca-massnahmen/<KÜRZEL>.json`, nur lesen).
    Fehlt bei Yahoo eine Ausschüttung eines gehaltenen Fonds, gilt REGEL C.4 (berichten; ein „schlägt nicht" trägt den Vermerk „Datenlücke gegen das Buch").

## 2. Zeitablauf und Mechanik (REGEL A.4–A.8, C.1, C.9 mit der Grundregel)

1. **Simulator `sektor.js`** ruft unverändert: `zielfunktion` und `placeboZiel` (`ziel.js`), `gleichgewicht` (`studien/momentum-korb-2026-10-04/korb.js`, Zielzahl =
   Länge der Zielliste = 3, 20 Bp), `bewerte` aus `mfhandel.js` (rundet auf Cent). Die Kennzahlen folgen `rueckblick.js` (Formeln von `kennzahlen`,
   `maxRueckschlag`, `kalenderjahre`, `median`; gerufen über eine dünne Anpassung an den Yahoo-Kalender oder wortgleich nachgebildet und per Test gegen die
   Originale geprüft). `korb.js`, `rueckblick.js` und `mfhandel.js` werden nicht geändert.
2. **Ein Handelstag** in der Reihenfolge von `simuliere` in `korb.js`: (1) Reihenende (bei den Fonds nicht erwartet; eine Lücke ist kein Ende), (2) Ausschüttungen
   des Tages ermitteln, (3) Umschichtung zur Eröffnung, wenn Ausführungstag — Zielliste aus den Zeilen bis zum Stichtag (Handelstag davor), (4) Ausschüttungen
   gutschreiben, (5) SPY, (6) Bewertung zum Schluss. Startkapital 100.000 $, SPY gekauft zur Eröffnung des ersten Ausführungstags ohne Kosten.
3. **Takt.** Der nächste Ausführungstag ist der 21. Handelstag nach dem letzten ausgeführten (`halten = 21`, REGEL A.5, C.1). Meldet die Zielfunktion `zuWenig`,
   wird nicht umgeschichtet und am nächsten Handelstag neu versucht; der Tag wird gezählt. Ausführungstage im Sinn der 5-%-Regel (REGEL C.2) = Umschichtungen +
   `zuWenig`-Tage; liegt der Anteil in einem Nachlauf der Fenster A oder B über 5 %, ist das Fenster **„nicht ausführbar"** (nie „schlägt nicht").
4. **Perioden** von Ausführungstag zu Ausführungstag (Grundregel §1.8); Klinke bei k = 0 ohne `zuWenig`: A **57** (56 volle, die letzte 7 Tage), B **60** (59 volle,
   die letzte 15 Tage).
5. **Kennzahlen.** p. a. geometrisch über Kalendertage / 365,25 vom ersten Ausführungstag bis zum Endtag, Abstand = Differenz der p.-a.-Werte; größter Rückschlag
   auf den Tagesschlüssen ab dem ersten Ausführungstag; Kalenderjahre wie `kalenderjahre`; Kosten = Wert zu Eröffnungskursen vor minus nach dem Handel (Klinke:
   0,002 × gehandeltes Volumen); gehaltene Fonds nach jeder Umschichtung (kleinste/größte Zahl, Häufigkeit je Fonds); größtes Gewicht wie Nr. 78 §1a.5.
   Endwert des Buchs = Wert aus `bewerte` (Cent), Endwert SPY ungerundet (wie `korb.js`); „vorn" heißt strikt Buch > SPY.
6. **t-Werte** (REGEL C.1: nachsehen, nicht schätzen): 97,5-%-Quantil der t-Verteilung, numerisch über die regularisierte unvollständige Betafunktion berechnet
   und gegen Tabellenwerte geprüft (1: 12,706 · 30: 2,042 · 60: 2,000 · 120: 1,980): **56 Freiheitsgrade → 2,0032 (A), 59 → 2,0010 (B)**. Ändert sich die
   Periodenzahl, gilt der berechnete Wert für n − 1.
7. **Startphasen:** erster Ausführungstag k Handelstage nach dem Fensterbeginn, k = 0 … 62, Ende gleich, p. a. über die eigene Dauer; jede Phase ein eigener
   Nachlauf ab 100.000 $. Hauptzahl je Fenster ist k = 0.

## 3. Urteil (REGEL Teil D, wörtlich angewandt)

1. **Je Fenster drei Bedingungen:** (1) k = 0: Buch > SPY (Endwerte, strikt); (2) mindestens **45 von 63** Startphasen Buch > SPY; (3) **Median** des Abstands
   (Pp p. a.) über die 63 Startphasen > 0. **„schlägt SPY"** nur, wenn alle drei in A **und** in B gelten; sonst **„schlägt nicht"** mit Zwischenurteil je Fenster
   („vorn nur in Fenster A", „vorn nur in Fenster B", „k = 0 vorn, aber unter 45 Phasen", „Median > 0, aber k = 0 nicht vorn" …) und den drei Zahlen.
   „Nicht ausführbar" (§2.3) geht jedem anderen Satz vor.
2. **Pflichtzeilen** je Fenster, für Kandidat und Placebo in derselben Tabelle: die drei Zahlen; Abstand je Periode (Mittel, Standardfehler, 95-%-Band, Vermerk
   „schließt 0 ein → nicht vom Zufall zu unterscheiden"); größter Rückschlag Buch und SPY; gezahlte Kosten; `zuWenig`-Tage; gehaltene Fonds; Kalenderjahre.
3. **Placebo** (REGEL C.6): `placeboZiel`, sonst alles gleich; ein Lauf, ein Seed (Seed je Stichtag aus dem festen Wort). Es bekommt dieselben Zeilen und Startphasen.
   **Momentum-Befund** heißt ein „schlägt SPY" nur, wenn der Kandidat auch das Placebo nach denselben drei Bedingungen in beiden Fenstern schlägt (k = 0 Kandidat >
   Placebo; mindestens 45 von 63 Phasen Kandidat > Placebo; Median des Abstands Kandidat − Placebo > 0). Dieser Vergleich wird immer berichtet.

## 4. Gesamtertrag auf zwei Wegen (Auftrag)

Die **Hauptrechnung** ist Schluss + Ausschüttungen (§1.7, Grundregel); nur sie trägt das Urteil. **Daneben**, für k = 0 in A und B, Kandidat und Placebo, dieselbe
Rechnung auf `adjclose`: Handel zu `open × adjclose / close`, Bewertung zu `adjclose`, keine Gutschriften (Buch und SPY), Rangbildung unverändert. Berichtet werden
Endwerte und Abstand p. a. beider Wege und der Unterschied. In der Datenprüfung (§1.10) steht derselbe Vergleich je Reihe und Fenster.

## 5. Zusatz ohne Urteil: 2000 bis 2026 und alle rollierenden Fünfjahresfenster (Auftrag)

1. **Langlauf „Regel":** die REGEL unverändert, auch die Umsatzschwelle 100 Mio $. Erster Ausführungstag = der erste Handelstag ab dem 03.01.2000, an dessen
   Stichtag die Zielfunktion nicht `zuWenig` meldet; Ende Schluss 15.09.2026. Spätere `zuWenig`-Tage werden gezählt, es wird nicht abgebrochen.
2. **Langlauf „ohne Schwelle":** einzige Änderung `umsatzMin = 0` (Parameter von `ziel.js`); erster Ausführungstag wie in 5.1 bestimmt. Grund: die Sektor-Fonds
   handelten um 2000 vermutlich weit unter 100 Mio $ am Tag [G, ungeprüft]; die Schwelle würde 2000–2026 sonst verkürzen. Wann eine Fassung rangieren kann, ist
   eine Frage der Reihenlänge und der Umsätze, nicht der Erträge.
3. **Rollierende Fünfjahresfenster** für beide Langläufe: Start an jedem Handelstag s ab dem ersten Ausführungstag des Langlaufs; Ende = letzter Handelstag mit
   Datum vor dem Kalendertag s + 5 Jahre (`Date.UTC(J + 5, M, T)`; Beispiel 16.09.2021 → 15.09.2026); nur Fenster mit Ende ≤ 15.09.2026. Je Fenster ein eigener
   Nachlauf ab 100.000 $ (erster Handel zur Eröffnung von s, Stichtag Vortag). Berichtet: Zahl der Fenster, Anteil Buch > SPY, Median, 10-%- und 90-%-Punkt des
   Abstands p. a., schlechtestes und bestes Fenster mit Daten, Anteil vorn je Startjahr. Placebo und „Kandidat gegen Placebo" mit denselben Zahlen.
4. Für beide Langläufe außerdem die Zeilen aus §3.2 (ohne Urteil) und die Kalenderjahre. Nichts aus §5 geht in das Urteil; keine weiteren Fenster.

## 6. Zwei Rechner

Neben `sektor.js` rechnet ein **zweiter, unabhängiger Rechner** (`zweitrechner.js`) k = 0 in A und B (Kandidat, als Zugabe auch Placebo). Er liest nur REGEL.md,
dieses ZUSATZ.md, die Texte der Grundregel (`massstab-rueckblick-2026-10-04/REGEL.md`, `momentum-korb-2026-10-04/REGEL.md`) und die Rohdateien — nicht `ziel.js`,
`korb.js`, `rueckblick.js`, `mfhandel.js` oder `sektor.js`. **Soll: Endwerte von Buch und SPY auf den Cent gleich.** Sonst wird die Ursache bis zur einzelnen
Umschichtung gesucht, benannt, behoben und vermerkt.

## 7. Reihenfolge

1. Dieses ZUSATZ.md und `laden.js` committen (**Siegel 1**) — vor jedem Kurs. 2. Laden, `pruefsummen.json`. 3. Datenprüfung; Simulator, Tests und zweiter Rechner
auf Kunstdaten bauen und prüfen — an den echten Daten vor Siegel 2 nur Klinken und die SPY-Pflichtprüfung, kein Buch. 4. Simulator, Tests, zweiter Rechner
committen (**Siegel 2**). 5. Ein Lauf, Ergebnis committen.

**Nicht gerechnet:** andere Rückblicke, Takte, Zielzahlen, Schwellen, Fenster oder Mechaniken als REGEL und §5; keine Auswahl unter den Startphasen; kein Wechsel
der Quelle oder einer Lesart nach dem Blick auf Erträge.
