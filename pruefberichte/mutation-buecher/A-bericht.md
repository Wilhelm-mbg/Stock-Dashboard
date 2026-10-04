# Mutationstest Gruppe A: Momentum-Buch, Zielbildung und Faelligkeit

Stand 61dca2c, Datum 04.10.2026. Dateien: mfhandel.js (buchKonfig, momentumZiel, rebalanceFaellig), liquide.js, momentum.js. Alles Simulation, keine Anlageberatung.

## Zahlen

- Mutanten: 60 (Liste: `A-mutanten.json`, Ergebnisse `A-ergebnis-1..6.json`)
- Von den vorhandenen Tests getoetet: 40
- Ueberlebt: 20 - davon aequivalent: 0; echte Luecke: 20 (HOCH 6, MITTEL 6, NIEDRIG 8)
- Mit `teil-A.test.js` (23 Pruefungen, Original gruen, unter 1 s): alle 20 Ueberlebenden getoetet (`A-ergebnis-neu.json`).

Schwerpunkt der Luecken: `rebalanceFaellig` (Zeitpunkt der Umschichtung um einen Handelstag) und die Altersgrenze von 7 Tagen. Dass `buchKonfig` und der Korbfilter dicht sind, liegt an test-v6 Block 34 (Aequivalenz zur Studie).

## Tabelle

| Kennung | Funktion | Aenderung | Urteil | Begruendung / getoetet durch | Schwere | Neuer Test |
|---|---|---|---|---|---|---|
| A-01 | buchKonfig | Rueckblick der Konfig +1 | getoetet (vorhandene Tests) | test-v6: 4 neu rot, z.B. ❌ 98.2 eine Reihe mit 253 Balken wird abgelegt (die Regel rangier |  |  |
| A-02 | buchKonfig | Luecke der Konfig +1 | getoetet (vorhandene Tests) | test-v6: 7 neu rot, z.B. ❌    Gegenprobe: ein Balken vom Ausfuehrungstag in der Rangfolge  |  |  |
| A-03 | buchKonfig | Haltedauer der Konfig 62 | getoetet (vorhandene Tests) | test-v6: 1 neu rot, z.B. ❌ Fenster des Buchs = Fenster der Studie (Rueckblick/Luecke/Halte |  |  |
| A-04 | buchKonfig | Anteil der Konfig verdoppelt | getoetet (vorhandene Tests) | test-v6: 4 neu rot, z.B. ❌ 98.3 die Zeile ist [t, close, stueck, adjclose]; die Rangfolge  |  |  |
| A-05 | buchKonfig | mindestWerte der Konfig -1 | getoetet (vorhandene Tests) | test-v6: 2 neu rot, z.B. ❌ Korbregel des Buchs = Korbregel der Studie (umsatzMin, mindestW |  |  |
| A-06 | buchKonfig | umsatzMin der Konfig /10 | getoetet (vorhandene Tests) | test-v6: 8 neu rot, z.B. ❌ 99,9 Mio $ fliegt VOR der Rangbildung mit Grund heraus |  |  |
| A-07 | buchKonfig | umsatzFenster der Konfig +1 | getoetet (vorhandene Tests) | test-v6: 3 neu rot, z.B. ❌ AEQUIVALENZ auch an einem zweiten Stichtag (Punkt-in-Zeit, 20 B |  |  |
| A-08 | buchKonfig | Kleinstanteil 0,5 statt 0,05 | getoetet (vorhandene Tests) | test-v6: 8 neu rot, z.B. ❌ 95.6 buchKonfig fuehrt den Schalter mit dem Wert 0,05 (an); die |  |  |
| A-09 | buchKonfig | Kleinstanteil 0 (Regel K aus) | getoetet (vorhandene Tests) | test-v6: 11 neu rot, z.B. ❌ 95.6 buchKonfig fuehrt den Schalter mit dem Wert 0,05 (an); di |  |  |
| A-10 | momentumZiel | Mindestlaenge 252 statt 253 | ECHTE LUECKE | Reihe mit genau 252 Balken: i-luecke-rueck = -1, r[-1][1] wirft TypeError, die ganze Zielbildung bricht ab (statt Verwerfen mit Grund). Randfall, aber ein Absturz der Umschichtung. | MITTEL | teil-A.test.js (GETOETET) |
| A-11 | momentumZiel | Mindestlaenge 254 (<=) | getoetet (vorhandene Tests) | test-v6: 1 neu rot, z.B. ❌ 98.2 eine Reihe mit 253 Balken wird abgelegt (die Regel rangier |  |  |
| A-12 | momentumZiel | Altersgrenze 8 statt 7 Tage | ECHTE LUECKE | Altersgrenze 8 statt 7 Tage: veraltete Serie (7 Tage + 1 h) rankt mit, Zielliste aendert sich. | HOCH | teil-A.test.js (GETOETET) |
| A-13 | momentumZiel | Altersgrenze 6 Tage | ECHTE LUECKE | Altersgrenze 6 statt 7 Tage: frische Serie (6,5 Tage) wird verworfen, Zielliste aendert sich. | HOCH | teil-A.test.js (GETOETET) |
| A-14 | momentumZiel | Altersvergleich >= statt > | ECHTE LUECKE | >= statt >: Serie genau 7 Tage alt faellt heraus; nur der exakte Grenzfall. | MITTEL | teil-A.test.js (GETOETET) |
| A-15 | momentumZiel | Startkurs um einen Tag verschoben | getoetet (vorhandene Tests) | test-v6: 3 neu rot, z.B. ❌ AEQUIVALENZ auch an einem zweiten Stichtag (Punkt-in-Zeit, 20 B |  |  |
| A-16 | momentumZiel | Endkurs der Staerke um einen Tag verschoben | getoetet (vorhandene Tests) | test-v6: 3 neu rot, z.B. ❌ AEQUIVALENZ auch an einem zweiten Stichtag (Punkt-in-Zeit, 20 B |  |  |
| A-17 | momentumZiel | Staerke bis heute statt bis Luecke (Lueckenmonat nicht ausgelassen) | getoetet (vorhandene Tests) | test-v6: 6 neu rot, z.B. ❌    Gegenprobe: ein Balken vom Ausfuehrungstag in der Rangfolge  |  |  |
| A-18 | momentumZiel | Staerke ohne -1 (Rang unveraendert, Wert +1) | getoetet (vorhandene Tests) | test-v6: 1 neu rot, z.B. ❌ Live-Buch und validierte Staerke liefern auf derselben Reihe de |  |  |
| A-19 | momentumZiel | Rangfolge aufsteigend (Schwaechste gekauft) | getoetet (vorhandene Tests) | test-v6: 16 neu rot, z.B. ❌    Gegenprobe: Rangfolge auf adjclose (Spalte 1 = adjclose) br |  |  |
| A-20 | momentumZiel | Mindestzahl Ziele 4 statt 5 | ECHTE LUECKE (nur ueber opts) | Mindestzahl 5 greift nur bei < 50 zulaessigen Werten; live verlangt mindestWerte=100 mindestens 10 Ziele, dort unerreichbar. Wirkt nur bei Aufrufen mit kleinem opts.minWerte (Werkzeuge/Tests). | NIEDRIG | teil-A.test.js (GETOETET) |
| A-21 | momentumZiel | Zielzahl abgerundet | getoetet (vorhandene Tests) | test-v6: 1 neu rot, z.B. ❌ AEQUIVALENZ: beide bilden DENSELBEN Korb (staerkstes Zehntel de |  |  |
| A-22 | momentumZiel | Zielzahl aufgerundet | getoetet (vorhandene Tests) | test-v6: 1 neu rot, z.B. ❌ AEQUIVALENZ auch an einem zweiten Stichtag (Punkt-in-Zeit, 20 B |  |  |
| A-23 | momentumZiel | Ziel um einen Wert laenger | getoetet (vorhandene Tests) | test-v6: 9 neu rot, z.B. ❌    Gegenprobe: ohne K1 faellt auf: der Kleinstkauf wird wieder  |  |  |
| A-24 | momentumZiel | mindestWerte <= statt < | getoetet (vorhandene Tests) | test-v6: 2 neu rot, z.B. ❌ 98.2 eine Reihe mit 253 Balken wird abgelegt (die Regel rangier |  |  |
| A-25 | momentumZiel | Korbzaehler ohneUmsatz/unterSchwelle vertauscht | ECHTE LUECKE | Korbzaehler ohneUmsatz/unterSchwelle vertauscht: nur Diagnose/Anzeige der Korbgroesse, keine Geldwirkung. | NIEDRIG | teil-A.test.js (GETOETET) |
| A-26 | momentumZiel | Korbzaehler zulaessig nicht gezaehlt | getoetet (vorhandene Tests) | test-v6: 1 neu rot, z.B. ❌ Korbzaehler: 101 zulaessig, 1 unter der Schwelle, 103 geprueft  |  |  |
| A-27 | momentumZiel | Standard-minWerte -1 | getoetet (vorhandene Tests) | test-v6: 1 neu rot, z.B. ❌ unter 100 zulaessigen Werten bildet das Buch keinen Korb (MINDE |  |  |
| A-28 | momentumZiel | Korbfilter am Vortag statt am Stichtag | getoetet (vorhandene Tests) | test-v6: 3 neu rot, z.B. ❌ AEQUIVALENZ auch an einem zweiten Stichtag (Punkt-in-Zeit, 20 B |  |  |
| A-29 | momentumZiel | p0-Pruefung entfernt | ECHTE LUECKE | p0-Pruefung entfernt: Wert mit Schlusskurs 0/NaN am Stichtag (Kurslücke) rankt mit, obwohl der Umsatz-Median ihn nicht ausschliesst. Randfall der Daten. | MITTEL | teil-A.test.js (GETOETET) |
| A-30 | momentumZiel | Umsatz der Rangfolge 0 | getoetet (vorhandene Tests) | test-v6: 1 neu rot, z.B. ❌ genau 100 Mio $ Median-Tagesumsatz ist zulaessig (>=, wie in de |  |  |
| A-31 | rebalanceFaellig | Grenze: Umschichtungstag zaehlt mit | ECHTE LUECKE | Balken des Umschichtungstags zaehlt mit: naechste Umschichtung einen Handelstag zu frueh (Zeitpunkt). | HOCH | teil-A.test.js (GETOETET) |
| A-32 | rebalanceFaellig | Grenze: Folgetag zaehlt nicht | ECHTE LUECKE | Erster Balken nach dem Tag zaehlt nicht: einen Handelstag zu spaet. | HOCH | teil-A.test.js (GETOETET) |
| A-33 | rebalanceFaellig | Balken genau an der Grenze zaehlt nicht | getoetet (vorhandene Tests) | test-v6: 1 neu rot, z.B. ❌ 84.4 fehlend, neu und nachgewachsen werden je einzeln genannt - |  |  |
| A-34 | rebalanceFaellig | faellig erst bei > halten | ECHTE LUECKE | faellig erst bei > halten: einen Handelstag zu spaet. | HOCH | teil-A.test.js (GETOETET) |
| A-35 | rebalanceFaellig | Standard-halten 62 | ECHTE LUECKE | Standard 62 statt 63, wenn halten fehlt; Aufrufer mit halten (Takt/Konfig) unberuehrt. | MITTEL | teil-A.test.js (GETOETET) |
| A-36 | rebalanceFaellig | Standard-halten 64 | ECHTE LUECKE | Standard 64 statt 63, wenn halten fehlt. | MITTEL | teil-A.test.js (GETOETET) |
| A-37 | rebalanceFaellig | ohne letzte Umschichtung nicht faellig | getoetet (vorhandene Tests) | test-v6: 1 neu rot, z.B. ❌ ohne Vorgeschichte ist sofort fällig |  |  |
| A-38 | rebalanceFaellig | Zeitstempel-Tag in UTC statt New York | ECHTE LUECKE | Zeitstempel-Tag in UTC statt New York: Umschichtung nach 19/20 Uhr New York wuerde dem Folgetag zugerechnet; betrifft nur Zeitstempel-Eingabe (Zeichenfolge-Datum unberuehrt). | MITTEL | teil-A.test.js (GETOETET) |
| A-39 | rebalanceFaellig | juengster Balken nicht gezaehlt | ECHTE LUECKE | Juengster Balken nicht gezaehlt: einen Handelstag zu spaet (Zeitpunkt). | HOCH | teil-A.test.js (GETOETET) |
| A-40 | median | Median unterer statt oberer Mittelwert | getoetet (vorhandene Tests) | test-v6: 3 neu rot, z.B. ❌ AEQUIVALENZ auch an einem zweiten Stichtag (Punkt-in-Zeit, 20 B |  |  |
| A-41 | median | Median: absteigend sortiert | getoetet (vorhandene Tests) | test-v6: 3 neu rot, z.B. ❌ AEQUIVALENZ auch an einem zweiten Stichtag (Punkt-in-Zeit, 20 B |  |  |
| A-42 | medianUmsatz | Umsatzfenster 21 Balken | getoetet (vorhandene Tests) | test-v6: 3 neu rot, z.B. ❌ AEQUIVALENZ auch an einem zweiten Stichtag (Punkt-in-Zeit, 20 B |  |  |
| A-43 | medianUmsatz | Umsatzfenster 19 Balken | getoetet (vorhandene Tests) | test-v6: 3 neu rot, z.B. ❌ AEQUIVALENZ auch an einem zweiten Stichtag (Punkt-in-Zeit, 20 B |  |  |
| A-44 | medianUmsatz | Stichtagsbalken nicht im Umsatzfenster | getoetet (vorhandene Tests) | test-v6: 3 neu rot, z.B. ❌ AEQUIVALENZ auch an einem zweiten Stichtag (Punkt-in-Zeit, 20 B |  |  |
| A-45 | medianUmsatz | Umsatz Summe statt Produkt | getoetet (vorhandene Tests) | test-v6: Exit 1 |  |  |
| A-46 | medianUmsatz | Indexgrenze | ECHTE LUECKE (unerreichbar im Buch) | Index == Laenge liefert NaN statt TypeError; momentumZiel ruft immer mit length-1, nur direkte Aufrufe betroffen. | NIEDRIG | teil-A.test.js (GETOETET) |
| A-47 | KORB | KORB.fenster 19 | getoetet (vorhandene Tests) | test-v6: 3 neu rot, z.B. ❌ AEQUIVALENZ auch an einem zweiten Stichtag (Punkt-in-Zeit, 20 B |  |  |
| A-48 | KORB | KORB.umsatzMin 10 Mio | getoetet (vorhandene Tests) | test-v6: 8 neu rot, z.B. ❌ 99,9 Mio $ fliegt VOR der Rangbildung mit Grund heraus |  |  |
| A-49 | KORB | KORB.umsatzMin +1 | getoetet (vorhandene Tests) | test-v6: 4 neu rot, z.B. ❌ Korbregel des Buchs = Korbregel der Studie (umsatzMin, mindestW |  |  |
| A-50 | KORB | KORB.mindestWerte 99 | getoetet (vorhandene Tests) | test-v6: 2 neu rot, z.B. ❌ Korbregel des Buchs = Korbregel der Studie (umsatzMin, mindestW |  |  |
| A-51 | zulaessig | Umsatzschwelle: > statt >= | getoetet (vorhandene Tests) | test-v6: 3 neu rot, z.B. ❌ Korbzaehler: 101 zulaessig, 1 unter der Schwelle, 103 geprueft  |  |  |
| A-52 | zulaessig | Schwelle 0 schaltet Filter nicht ab | ECHTE LUECKE (nur ueber opts) | Schwelle 0 schaltet Filter nicht ab; live wird umsatzMin nie 0 uebergeben (Konfig 100 Mio). | NIEDRIG | teil-A.test.js (GETOETET) |
| A-53 | zulaessig | umsatzMin 0 ersetzt durch Standard | ECHTE LUECKE (nur ueber opts) | umsatzMin 0 durch Standard ersetzt; live nicht erreichbar, nur Werkzeugaufrufe. | NIEDRIG | teil-A.test.js (GETOETET) |
| A-54 | hatUmsatz | hatUmsatz ohne isFinite | ECHTE LUECKE | NaN/Infinity-Stueckzahl zaehlt als vorhanden: Grund "unter Schwelle" statt "keine Stueckzahlen", der Wert faellt in beiden Faellen aus dem Korb. | NIEDRIG | teil-A.test.js (GETOETET) |
| A-55 | hatUmsatz | hatUmsatz ohne Stichtagsbalken | ECHTE LUECKE | Stichtagsbalken in hatUmsatz nicht beachtet: nur wenn allein dieser Balken Stueckzahl traegt; Grund-Text/Zaehler. | NIEDRIG | teil-A.test.js (GETOETET) |
| A-56 | STANDARD | STANDARD.rueckblick 230 | getoetet (vorhandene Tests) | test-v6: 4 neu rot, z.B. ❌ AEQUIVALENZ auch an einem zweiten Stichtag (Punkt-in-Zeit, 20 B |  |  |
| A-57 | STANDARD | STANDARD.luecke 20 | getoetet (vorhandene Tests) | test-v6: 4 neu rot, z.B. ❌ AEQUIVALENZ auch an einem zweiten Stichtag (Punkt-in-Zeit, 20 B |  |  |
| A-58 | STANDARD | STANDARD.halten 62 | getoetet (vorhandene Tests) | test-v6: 2 neu rot, z.B. ❌ Fenster des Buchs = Fenster der Studie (Rueckblick/Luecke/Halte |  |  |
| A-59 | STANDARD | STANDARD.anteil 0,2 | getoetet (vorhandene Tests) | test-v6: 5 neu rot, z.B. ❌ 98.3 die Zeile ist [t, close, stueck, adjclose]; die Rangfolge  |  |  |
| A-60 | STANDARD | STANDARD.minWerte 24 (vom Buch ungenutzt) | ECHTE LUECKE (Studienwerkzeug) | STANDARD.minWerte (25) wird nur von Momentum.rangfolge genutzt (Studien), nicht vom Buch; dort Mindestzahl der Rangfolge. | NIEDRIG | teil-A.test.js (GETOETET) |

## Anmerkungen (keine Mutanten)

- Der Zeitstempel-Zweig in `rebalanceFaellig` (typeof string) und die Standardwerte `halten || 63` sind im echten Ablauf offenbar durch den Takt (`faelligkeit()`) ueberlagert; die Funktion bleibt laut Kommentar fuer Aufrufer, die nur ja/nein brauchen. Wer sie nicht mehr nutzt, sollte sie entfernen statt weiter pruefen.
- `momentumZiel`: die Mindestzahl 5 (`Math.max(5, ...)`) ist mit mindestWerte=100 live toter Code; `STANDARD.minWerte` (25) in momentum.js steht neben `Li.KORB.mindestWerte` (100) - zwei Zahlen fuer verwandte Schwellen, das Buch nutzt nur die zweite.
- Eine Reihe mit exakt 252 Balken wuerde ohne die Laengenpruefung abstuerzen (Index -1); die Pruefung ist daher tragend, nicht Kosmetik (A-10).
- `opts.minWerte`, `opts.umsatzMin` nutzen `||`/`== null` uneinheitlich: `umsatzMin: 0` ist erlaubt, `anteil: 0` oder `minWerte: 0` fallen still auf den Standard zurueck.
- Harness: ein vertauschender Mutant (A-25) wird von einem Test mit je einem Fall pro Zaehler nicht getoetet (Symmetrie); der Test nutzt deshalb 2:1.
