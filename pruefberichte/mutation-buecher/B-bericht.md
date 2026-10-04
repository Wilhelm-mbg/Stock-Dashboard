# Mutationsbericht Gruppe B: Momentum-Buch, mfhandel.js

Stand 61dca2c, 04.10.2026. Funktionen: planeUmschichtung, fuehreAus, bewerte, faelligkeit/rebalanceFaellig (samt New-Yorker Uhr), offeneAuftraege/offenLaeuft/offenWerte/nachfassen/offenBeenden. Simulation mit virtuellem Kapital, keine Anlageberatung.

## Zahlen

- Mutanten: 102 (Liste `B-mutanten.json`; 8 anfangs wegen mehrfacher Fundstelle ungueltig, mit `nr: 1` neu gelaufen, danach alle gueltig)
- Von den bestehenden Tests getoetet: 83; ueberlebt: 19
- Ueberlebt davon aequivalent: 7; echte Luecke: 12 (HOCH 3, MITTEL 4, NIEDRIG 5)
- Neue Kleinsttests `teil-B.test.js` (51 Zusicherungen, auf dem Original gruen, unter 1 s): toeten alle 12 echten Luecken (`B-ergebnis-neu.json`: 12 getoetet, 7 ueberlebt = die aequivalenten).

Hinweis zur Messung: Ein Teil der Kills stammt aus test-v6 ("neu rot"); die Rohergebnisse stehen in `B-ergebnis-1..10.json` (9 und 10 = Wiederholung der zunaechst ungueltigen Mutanten). Die Harness-Laeufe liefen bei hoher Last (mehrere Gruppen parallel), Urteile sind davon nicht betroffen.

## Tabelle

| Kennung | Funktion | Aenderung | Urteil | Begruendung (Ueberlebende) | Schwere | Toetet |
|---|---|---|---|---|---|---|
| B-01 | planeUmschichtung | K2 Kleinstbestand: < zu <= | getoetet | - | - | bestehende Tests |
| B-02 | planeUmschichtung | Platzwert: Zielzahl+1 | getoetet | - | - | bestehende Tests |
| B-03 | planeUmschichtung | Depotwert ohne Bargeld | getoetet | - | - | bestehende Tests |
| B-04 | planeUmschichtung | Position ohne Kurs nicht mehr in halten | getoetet | - | - | bestehende Tests |
| B-05 | planeUmschichtung | K2: Schwelle gegen Depotwert statt Platzwert | getoetet | - | - | bestehende Tests |
| B-06 | planeUmschichtung | Kleinstbestand wird nicht neu geplant | getoetet | - | - | bestehende Tests |
| B-07 | planeUmschichtung | Neukauf: // zu && | getoetet | - | - | bestehende Tests |
| B-08 | planeUmschichtung | Neukauf-Stueck: floor statt round | getoetet | - | - | bestehende Tests |
| B-09 | planeUmschichtung | Neukauf-Stueck: 3 statt 4 Stellen | getoetet | - | - | bestehende Tests |
| B-10 | planeUmschichtung | Neukauf-Stueck: budget > 0 zu >= 0 | UEBERLEBT: AEQUIVALENT | Bei budget = 0 ist Math.round(0 / kurs ...) ebenfalls 0; 20.000 Zufallslaeufe plan+fuehreAus ohne Abweichung. | - | - |
| B-11 | planeUmschichtung | Ziel ohne Kurs nicht in fehltKurs | getoetet | - | - | bestehende Tests |
| B-12 | planeUmschichtung | Vorgabe Kleinstanteil ohne opts 0,05 statt aus | getoetet | - | - | bestehende Tests |
| B-13 | planeUmschichtung | plan.kleinst immer gesetzt | getoetet | - | - | bestehende Tests |
| B-14 | planeUmschichtung | Rueckgabe depotwert = budget | getoetet | - | - | bestehende Tests |
| B-15 | planeUmschichtung | nie verkaufen (Nicht-Ziel wird gehalten) | getoetet | - | - | bestehende Tests |
| B-16 | planeUmschichtung | Position ohne Kurs: Einstand als Kurs (Verkauf) | getoetet | - | - | bestehende Tests |
| B-17 | fuehreAus | Vorgabe-Kosten 10 statt 20 Bp | getoetet | - | - | bestehende Tests |
| B-18 | fuehreAus | Kosten Bp: Teiler 1000 | getoetet | - | - | bestehende Tests |
| B-19 | fuehreAus | Verkaufserloes: Kosten addiert | getoetet | - | - | bestehende Tests |
| B-20 | fuehreAus | pnl ohne Cent-Rundung | getoetet | - | - | bestehende Tests |
| B-21 | fuehreAus | pnl auf 10 Cent | getoetet | - | - | bestehende Tests |
| B-22 | fuehreAus | pnl ohne Verkaufskosten | getoetet | - | - | bestehende Tests |
| B-23 | fuehreAus | Kauf: Bargeldpruefung > zu >= | UEBERLEBT: ECHTE LUECKE | Genau aufgebrauchtes Bargeld (Kosten == Bargeld): Original kauft die volle Stueckzahl, Mutant verkleinert um 0,0001 Stueck und laesst Bargeld liegen. In 200.000 Zufallsfaellen mit Kosten == Bargeld wichen 40.233 ab (z. B. 1,4875 x 700,03 bei 20 Bp). Selten im echten Ablauf (Bargeld muss exakt den Kosten entsprechen), aber echter Geld-/Stueckzahlunterschied. | MITTEL | teil-B.test.js (bestaetigt) |
| B-24 | fuehreAus | Kauf: Bargeldpruefung mit 1 Spielraum (Bargeld kann negativ werden) | getoetet | - | - | bestehende Tests |
| B-25 | fuehreAus | Verkleinerung: round statt floor | getoetet | - | - | bestehende Tests |
| B-26 | fuehreAus | Verkleinerung ohne Kostenfaktor | getoetet | - | - | bestehende Tests |
| B-27 | fuehreAus | Verkleinert auf 0: Position mit 0 Stueck gebucht | getoetet | - | - | bestehende Tests |
| B-28 | fuehreAus | K1: < zu <= | getoetet | - | - | bestehende Tests |
| B-29 | fuehreAus | K1: ohne budget>0-Bedingung | getoetet | - | - | bestehende Tests |
| B-30 | fuehreAus | K1: Wert inkl. Kosten | getoetet | - | - | bestehende Tests |
| B-31 | fuehreAus | Kauf: Bargeld ohne Kosten abgezogen | getoetet | - | - | bestehende Tests |
| B-32 | fuehreAus | Einstand ohne Kosten | getoetet | - | - | bestehende Tests |
| B-33 | fuehreAus | seit nicht gesetzt | getoetet | - | - | bestehende Tests |
| B-34 | fuehreAus | Tradeprotokoll 399 statt 400 | UEBERLEBT: ECHTE LUECKE | Kappung des Tradeprotokolls auf 400 (399 statt 400). Nur Protokolllaenge, kein Geld. | NIEDRIG | teil-B.test.js (bestaetigt) |
| B-35 | fuehreAus | Trade-Grenze 401 | UEBERLEBT: ECHTE LUECKE | Kappung greift erst bei 402 statt 401 Eintraegen. Nur Protokolllaenge. | NIEDRIG | teil-B.test.js (bestaetigt) |
| B-36 | fuehreAus | Kauf zaehlt nicht in Rueckgabe | getoetet | - | - | bestehende Tests |
| B-37 | fuehreAus | Verkauf zaehlt nicht in Rueckgabe | getoetet | - | - | bestehende Tests |
| B-38 | fuehreAus | Erloes mit o.stueck statt Positionsbestand | UEBERLEBT: AEQUIVALENT | o.stueck ist in jedem Aufrufer (planeUmschichtung, nachfassen) gleich dem Bestand p.stueck; 20.000 Zufallslaeufe ohne Abweichung. | - | - |
| B-39 | fuehreAus | Verkaufte Position bleibt im Buch | getoetet | - | - | bestehende Tests |
| B-40 | fuehreAus | Reihenfolge: erst Kaeufe, dann Verkaeufe | getoetet | - | - | bestehende Tests |
| B-41 | bewerte | bewerte ohne Rundung | UEBERLEBT: ECHTE LUECKE | bewerte ohne Rundung auf Cent: der angezeigte Depotwert/Buchwert waere ungerundet (Anzeige einer Geldzahl). | MITTEL | teil-B.test.js (bestaetigt) |
| B-42 | bewerte | bewerte auf 10 Cent | UEBERLEBT: ECHTE LUECKE | bewerte rundet auf 10 Cent statt 1 Cent: angezeigter Depotwert um bis zu 5 Cent falsch. | MITTEL | teil-B.test.js (bestaetigt) |
| B-43 | bewerte | bewerte: Position ohne Kurs zaehlt 0 | getoetet | - | - | bestehende Tests |
| B-44 | bewerte | bewerte: ohneKurs nicht gemeldet | getoetet | - | - | bestehende Tests |
| B-45 | bewerte | bewerte ohne Bargeld | getoetet | - | - | bestehende Tests |
| B-46 | faelligkeit | faellig bei halten statt halten-1 | getoetet | - | - | bestehende Tests |
| B-47 | faelligkeit | faellig: >= zu > | getoetet | - | - | bestehende Tests |
| B-48 | faelligkeit | noch: halten statt halten-1 | getoetet | - | - | bestehende Tests |
| B-49 | faelligkeit | verspaetung ohne -1 | getoetet | - | - | bestehende Tests |
| B-50 | faelligkeit | veraltet ab 5 Werktagen | getoetet | - | - | bestehende Tests |
| B-51 | faelligkeit | veraltet ab 3 Werktagen | getoetet | - | - | bestehende Tests |
| B-52 | faelligkeit | Vorgabe halten 62 | getoetet | - | - | bestehende Tests |
| B-53 | faelligkeit | Erste Umschichtung nicht faellig | UEBERLEBT: ECHTE LUECKE | Erste Umschichtung (ohne letzteAusfuehrungTag) gaelte als nicht faellig: ein neues Buch wuerde nie starten. Kein bestehender Test prueft faelligkeit() ohne Ausfuehrungstag. | HOCH | teil-B.test.js (bestaetigt) |
| B-54 | faelligkeit | faelligkeit: heute in UTC statt New York | UEBERLEBT: ECHTE LUECKE | faelligkeit rechnet "heute" in UTC statt New York: zwischen 19:00 und 24:00 New Yorker Zeit ist der UTC-Tag schon der naechste; r.heute und die Obergrenze bei balkenNach verschieben sich (Zeitpunkt der Umschichtung). | HOCH | teil-B.test.js (bestaetigt) |
| B-55 | faelligkeit | Rueckstand: bis exklusive | getoetet | - | - | bestehende Tests |
| B-56 | faelligkeit | tageSeit ohne Obergrenze heute | UEBERLEBT: ECHTE LUECKE | tageSeit ohne Obergrenze "heute": der laufende Balken von heute wuerde mitgezaehlt, die Umschichtung einen Handelstag zu frueh faellig (62 statt 63). | HOCH | teil-B.test.js (bestaetigt) |
| B-57 | faelligkeit | balkenNach: Ausfuehrungstag zaehlt mit | getoetet | - | - | bestehende Tests |
| B-58 | faelligkeit | balkenNach ohne max 0 | getoetet | - | - | bestehende Tests |
| B-59 | faelligkeit | rebalanceFaellig: > statt >= | UEBERLEBT: ECHTE LUECKE | rebalanceFaellig: > statt >= bei 63. Funktion hat im App-Pfad keinen Aufrufer (mfdepot.js nutzt faelligkeit()); nur fuer Aufrufer, die ja/nein brauchen. | NIEDRIG | teil-B.test.js (bestaetigt) |
| B-60 | faelligkeit | rebalanceFaellig: 62 | UEBERLEBT: ECHTE LUECKE | rebalanceFaellig: Vorgabe 62 statt 63; kein Aufrufer im App-Pfad. | NIEDRIG | teil-B.test.js (bestaetigt) |
| B-61 | faelligkeit | rebalanceFaellig: Umschichtungstag zaehlt mit | UEBERLEBT: ECHTE LUECKE | rebalanceFaellig: Umschichtungstag zaehlt mit; kein Aufrufer im App-Pfad. | NIEDRIG | teil-B.test.js (bestaetigt) |
| B-62 | faelligkeit | rebalanceFaellig: ohne letztes nicht faellig | getoetet | - | - | bestehende Tests |
| B-63 | Uhr | Zeitzone UTC statt New York | getoetet | - | - | bestehende Tests |
| B-64 | Uhr | Stunde ohne %24 | UEBERLEBT: AEQUIVALENT | Intl liefert mit hourCycle h23 nie "24"; 15-Minuten-Raster ueber ein Jahr ohne Abweichung bei nyUhr/nyTag. (Haengt von der ICU-Fassung ab; Absicherung gegen alte Laufzeiten.) | - | - |
| B-65 | Uhr | Balken fertig 16:00 statt 16:15 | getoetet | - | - | bestehende Tests |
| B-66 | Uhr | Handel ab 09:30 statt 09:35 | getoetet | - | - | bestehende Tests |
| B-67 | Uhr | Handel ab 09:40 | getoetet | - | - | bestehende Tests |
| B-68 | Uhr | nyZeit Startschaetzung 4h | UEBERLEBT: AEQUIVALENT | Die Korrekturschleife heilt die andere Startschaetzung; Abweichung nur bei nicht existierenden Ortszeiten (02:00-02:59 am Umstelltag, 16 von 70.128 Probepunkten 2024-2027); Aufrufer nutzen 00:00, 09:30, 16:00, 16:15. | - | - |
| B-69 | Uhr | nyZeit nur eine Iteration | UEBERLEBT: AEQUIVALENT | Die erste Iteration korrigiert bereits (Offset schon nach einem Schritt gefunden); 70.128 Probepunkte ohne Abweichung. | - | - |
| B-70 | Uhr | Samstag als Werktag | getoetet | - | - | bestehende Tests |
| B-71 | Uhr | Sonntag als Werktag | getoetet | - | - | bestehende Tests |
| B-72 | Uhr | letzterFertigerWerktag: > statt >= | getoetet | - | - | bestehende Tests |
| B-73 | Uhr | bestandFrisch: > statt >= | getoetet | - | - | bestehende Tests |
| B-74 | Uhr | bestandFrisch: at 0 gilt gueltig | UEBERLEBT: AEQUIVALENT | at = 0 wird sowieso von at >= nyZeit(...) abgelehnt (nyZeit ist riesig); kein Eingabewert unterscheidet. | - | - |
| B-75 | Uhr | ohneLaufendenBalken: > statt >= | getoetet | - | - | bestehende Tests |
| B-76 | Uhr | ohneLaufendenBalken: Balken um 00:00 bleibt | getoetet | - | - | bestehende Tests |
| B-77 | Uhr | indexVor: <= statt < | getoetet | - | - | bestehende Tests |
| B-78 | Uhr | ohneLaufendenBalken: Tagesgrenze 09:30 | getoetet | - | - | bestehende Tests |
| B-79 | Uhr | werktagVor: 2 Tage zurueck | getoetet | - | - | bestehende Tests |
| B-80 | offen* | offenLaeuft: <= statt < | getoetet | - | - | bestehende Tests |
| B-81 | offen* | Nachfassen bis 16:30 | getoetet | - | - | bestehende Tests |
| B-82 | offen* | offenLaeuft: Tagespruefung entfernt | getoetet | - | - | bestehende Tests |
| B-83 | offen* | offeneAuftraege: Verkauf nur bei Ziel | getoetet | - | - | bestehende Tests |
| B-84 | offen* | offeneAuftraege: Budget = Depotwert | getoetet | - | - | bestehende Tests |
| B-85 | offen* | offeneAuftraege: Kaeufe unsortiert | getoetet | - | - | bestehende Tests |
| B-86 | offen* | offeneAuftraege: Rang ab 0 | getoetet | - | - | bestehende Tests |
| B-87 | offen* | offenWerte: unsortiert | getoetet | - | - | bestehende Tests |
| B-88 | offen* | nachRang umgekehrt | getoetet | - | - | bestehende Tests |
| B-89 | offen* | nachfassen: round statt floor | getoetet | - | - | bestehende Tests |
| B-90 | offen* | nachfassen Vorgabekosten 10 | getoetet | - | - | bestehende Tests |
| B-91 | offen* | nachfassen: schon gehaltener Kauf nicht verworfen (Doppelkauf) | getoetet | - | - | bestehende Tests |
| B-92 | offen* | nachfassen: Verkauf ohne Bestand nicht verworfen | getoetet | - | - | bestehende Tests |
| B-93 | offen* | nachfassen: offen bleibt leer stehen | getoetet | - | - | bestehende Tests |
| B-94 | offen* | nachfassen: geaendert ohne entfallen | UEBERLEBT: ECHTE LUECKE | nachfassen: geaendert ignoriert entfallene Auftraege. Ist nur ein Auftrag entfallen, wird offen geloescht, aber der Aufrufer (mfdepot.js gibt res.geaendert zurueck) speichert/zeichnet nicht neu. | MITTEL | teil-B.test.js (bestaetigt) |
| B-95 | offen* | nachfassen: Regel K nicht durchgereicht | getoetet | - | - | bestehende Tests |
| B-96 | offen* | nachfassen: kursT nicht gestempelt | getoetet | - | - | bestehende Tests |
| B-97 | offen* | nachfassen: wartet nicht gemeldet | getoetet | - | - | bestehende Tests |
| B-98 | offen* | nachfassen: budget >= 0 | UEBERLEBT: AEQUIVALENT | k.budget = 0 liefert in beiden Faellen stueck 0 (Math.floor(0 / kurs ...) = 0); 20.000 Zufallslaeufe. | - | - |
| B-99 | offen* | offenBeenden: laufendes offen wird geloescht | getoetet | - | - | bestehende Tests |
| B-100 | offen* | offenBeenden: offen bleibt | getoetet | - | - | bestehende Tests |
| B-101 | offen* | nachfassen: erster Verkauf uebergangen | getoetet | - | - | bestehende Tests |
| B-102 | offen* | stempleKursT: ueberschreibt vorhandenes kursT | getoetet | - | - | bestehende Tests |

## Anmerkungen (keine Mutanten, nur berichtet)

- `letztesRebalanceT` / `letzteAusfuehrungTag` werden in `mfhandel.js` nirgends gesetzt: `fuehreAus` fasst sie nicht an, das Setzen "nur wenn ausgefuehrt" liegt in `mfdepot.js` (ca. Zeile 423 ff.) und war nicht Gegenstand dieser Gruppe (Datei der Mutanten: mfhandel.js). Dort sollte eine eigene Mutationsrunde pruefen, dass ein Lauf ohne Ausfuehrung den Merker nicht setzt.
- `rebalanceFaellig` hat im App-Pfad keinen Aufrufer (nur Kommentar in mfdepot.js ca. Zeile 711; der Takt rechnet mit `faelligkeit`). Die Funktion ist toter Code mit eigener, abweichender Zaehlweise (zaehlt `>= halten`, `faelligkeit` zaehlt `>= halten - 1` mit Abruf am Ausfuehrungstag). Wer sie spaeter aufruft, erhaelt einen Handelstag spaeteren Termin. Die neuen Tests pinnen das heutige Verhalten.
- `fuehreAus` prueft die Kosten gegen das Bargeld mit Gleitkomma-Gleichheit; bei exakt aufgebrauchtem Bargeld haengt das Ergebnis von der Rundung ab (siehe B-23). Original verhaelt sich hier richtig, Test pinnt es.
- `nyZeit` liefert fuer nicht existierende Ortszeiten (02:xx am Umstelltag im Maerz) einen um eine Stunde anderen Wert je nach Startschaetzung; im App-Pfad werden nur 00:00, 09:30/09:35, 16:00 und 16:15 abgefragt, daher ohne Wirkung.
- Konstanten `HANDEL_AB = [9, 35]` (nicht 09:30) werden in mfhandel.js nur exportiert; verwendet in mfdepot.js. Der neue Test pinnt den Wert (Mutanten B-66/B-67 wurden von test-v6 bereits bemerkt).
- Die Zusicherungen der neuen Tests stuetzen sich auf feste Uhrzeiten in Winterzeit (UTC-5) und je einen Sommerzeit-/Umstelltag; kein `Date.now()`.
