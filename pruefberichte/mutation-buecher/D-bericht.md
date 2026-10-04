# Mutationstest Gruppe D - Ablauf der Umschichtung (mfdepot.js) und Zerlegen der Tagesreihe (kurse.js)

Stand 04.10.2026, Basis 61dca2c. Simulation mit virtuellem Kapital, keine Anlageberatung. Der App-Code ist unveraendert.

## Ergebnis

- Mutanten: **202** (Liste: `D-mutanten.json`, Ergebnisse `D-ergebnis-1..7.json`, Nachlauf `D-ergebnis-neu.json`)
- Von den bestehenden Tests (test-v6, test-channel, Kleinsttests 1-15) getoetet: **127**
- Ueberlebt: **75**, davon aequivalent bzw. praktisch aequivalent: **13**, echte Luecken: **62** (HOCH 9, MITTEL 24, NIEDRIG 29)
- `teil-D.test.js` (115 Pruefungen, unter 1 s) ist auf dem Original gruen und toetet **74 von 75** Ueberlebenden. Nicht toetbar: D-197 (nachweislich aequivalent). Von den als aequivalent geurteilten toetet der Test zusaetzlich D-08, D-61, D-66, D-71, D-148, D-153, D-155, D-157, D-158, D-178, D-180, D-189 durch kuenstliche Eingaben bzw. durch Festnageln des Abrufparameters; im echten Ablauf aendern sie nichts.
- Schwerpunkt der HOCH-Luecken: `buchInit` (Startkapital, Bargeld, letztesRebalanceT) ist ungetestet; der Takt-Zweig der Umschichtung ist nur an der Oberflaeche (Journalzeile) geprueft - Faelligkeitsrand 62/61, Ausfuehrungstag, Eroeffnung des ersten Ziels und die Sperre bei veralteter Marktreihe waren ungeschuetzt; Reihenende im Drift-Buch.

## Wie gemessen

`node pruefberichte/mutation-buecher/harness.js` in sieben Staplen (je ~32 Mutanten, Arbeitsordner /tmp/mut-D1..7); Stapel 7 (D-191..D-202, Zeit-/Randmutanten) lief ohne meine Testdatei im Baum, damit das Urteil allein die bestehenden Tests meint. Nachlauf mit `NUR_NEUE_TESTS=1`. Die Tests der Gruppe nutzen mfdepot.js in einer vm-Sandbox; die inneren Funktionen werden dort ueber einen im Test angehaengten Export `window.__INT` erreicht (Datei unveraendert).

## Tabelle

| Kennung | Funktion | Aenderung | Urteil / Begruendung | Schwere | Test, der ihn toetet |
|---|---|---|---|---|---|
| D-01 | buchInit | Startbargeld 90 % statt 100 % | UEBERLEBT: ECHTE LUECKE - Neues Buch startet mit 90 % Bargeld; buchInit wird von keinem Test aufgerufen. | HOCH | teil-D.test.js |
| D-02 | buchInit | letztesRebalanceT startet mit Date.now() statt 0 | UEBERLEBT: ECHTE LUECKE - letztesRebalanceT = jetzt: takt leitet daraus letzteAusfuehrungTag ab, die erste Umschichtung des neuen Buchs verschiebt sich um 63 Handelstage. | HOCH | teil-D.test.js |
| D-03 | buchInit | Konfig nur fuer NICHT-momentum-Buecher gesetzt | UEBERLEBT: ECHTE LUECKE - Neues Momentum-Buch ohne Konfiguration: erste Takt-Zeile meldet eine Scheinumstellung, Vorwaertstest-Merker gehen verloren. | MITTEL | teil-D.test.js |
| D-04 | buchInit | liquideSeit startet mit angelegt statt null | UEBERLEBT: ECHTE LUECKE - liquideSeit = angelegt: Beginn des Vorwaertstests falsch gesetzt (Messung/Anzeige). | MITTEL | teil-D.test.js |
| D-05 | buchInit | START_KAPITAL 10000 statt 100000 | UEBERLEBT: ECHTE LUECKE - Startkapital 10.000 statt 100.000 fuer beide Buecher und den Tagespunkt-Fallback. | HOCH | teil-D.test.js |
| D-06 | buchInit | konfigSeit 0 statt angelegt | UEBERLEBT: ECHTE LUECKE - konfigSeit 0: nur Anzeige "Konfiguration seit ...". | NIEDRIG | teil-D.test.js |
| D-07 | kleinstWert | fehlendes Feld zaehlt als 0,05 statt aus | getoetet (bestehende Tests) | - | - |
| D-08 | kleinstWert | negativer/0-Wert wird nicht auf 0 gezwungen (>= 0 statt > 0 und Rueckgabe -1) | UEBERLEBT: AEQUIVALENT - kleinstAnteil ist in jeder erreichbaren Konfiguration undefined, 0 oder 0,05, nie negativ/NaN; der Test kuenstlich mit -1 getoetet. | - | teil-D.test.js |
| D-09 | feldGleich | Vergleich a[k] <= b[k] statt === | getoetet (bestehende Tests) | - | - |
| D-10 | feldGleich | kleinstAnteil wird roh verglichen statt ueber kleinstWert | UEBERLEBT: ECHTE LUECKE - Altbuch ohne Feld kleinstAnteil gegen 0: faelschlich eine Umstellungszeile (einmalig, kein Handel). | NIEDRIG | teil-D.test.js |
| D-11 | konfigGleich | every -> some | getoetet (bestehende Tests) | - | - |
| D-12 | konfigGleich | fehlende Konfig gilt als gleich | getoetet (bestehende Tests) | - | - |
| D-13 | KONFIG_FELDER | Feld mindestWerte aus der Liste entfernt | getoetet (bestehende Tests) | - | - |
| D-14 | KONFIG_FELDER | Feld umsatzMin aus der Liste entfernt | getoetet (bestehende Tests) | - | - |
| D-15 | KONFIG_FELDER | Feld halten aus der Liste entfernt | getoetet (bestehende Tests) | - | - |
| D-16 | umstellungPruefen | andere Felder: feldGleich nicht negiert | getoetet (bestehende Tests) | - | - |
| D-17 | umstellungPruefen | ohne Konfig gilt nichts als anders (Zweig "nur Regel K") | getoetet (bestehende Tests) | - | - |
| D-18 | umstellungPruefen | kleinstSeit nicht gesetzt | getoetet (bestehende Tests) | - | - |
| D-19 | umstellungPruefen | Kleinst-Zweig meldet false (nicht speichern) | getoetet (bestehende Tests) | - | - |
| D-20 | umstellungPruefen | Prozentzahl in Journal: *100/10 statt *1000/10 | getoetet (bestehende Tests) | - | - |
| D-21 | umstellungPruefen | stufe(): Prozent *100/10 | getoetet (bestehende Tests) | - | - |
| D-22 | umstellungPruefen | Kleinst-Zweig setzt konfig nicht | getoetet (bestehende Tests) | - | - |
| D-23 | umstellungPruefen | Umstellung setzt liquideSeit nicht zurueck | getoetet (bestehende Tests) | - | - |
| D-24 | umstellungPruefen | Umstellung setzt korbVerlauf nicht zurueck | getoetet (bestehende Tests) | - | - |
| D-25 | umstellungPruefen | Umstellung setzt konfig nicht | getoetet (bestehende Tests) | - | - |
| D-26 | umstellungPruefen | Umstellung setzt konfigSeit nicht | getoetet (bestehende Tests) | - | - |
| D-27 | umstellungPruefen | Altwert-Text: Rueckblick 252 statt 231 | UEBERLEBT: ECHTE LUECKE - Text der Journalzeile (Altwert 252 statt 231). | NIEDRIG | teil-D.test.js |
| D-28 | konfigText | anteil *10 statt *100 | UEBERLEBT: ECHTE LUECKE - Text: "staerkste 1 %" statt 10 % in der Umstellungszeile (Zahl, die der Anwender sieht). | NIEDRIG | teil-D.test.js |
| D-29 | konfigText | Umsatz in 1e5 statt 1e6 | UEBERLEBT: ECHTE LUECKE - Text: Umsatzgrenze 1000 statt 100 Mio $ in der Umstellungszeile. | NIEDRIG | teil-D.test.js |
| D-30 | kleinstText | Prozent *100/10 | getoetet (bestehende Tests) | - | - |
| D-31 | takt/Umstellung | umstellungPruefen-Ergebnis fuehrt nicht zum Speichern | UEBERLEBT: ECHTE LUECKE - Eine erkannte Konfigurationsumstellung wird nicht gespeichert (geht beim Neustart verloren, erneute Zeile). | MITTEL | teil-D.test.js |
| D-32 | massnahmenBuchen | Drift-Buch wird nicht gebucht | getoetet (bestehende Tests) | - | - |
| D-33 | massnahmenBuchen | Buecher vertauscht | getoetet (bestehende Tests) | - | - |
| D-34 | massnahmenBuchen | Ereignisse nicht uebergeben | getoetet (bestehende Tests) | - | - |
| D-35 | massnahmenBuchen | barZeit nicht uebergeben | getoetet (bestehende Tests) | - | - |
| D-36 | massnahmenBuchen | Zeit now + 1 Tag | UEBERLEBT: ECHTE LUECKE - Buchungsstempel "am" und Nachtrag-Satz im Journal; Bargeld unberuehrt. | NIEDRIG | teil-D.test.js |
| D-37 | massnahmenBuchen | geaendert wird nach Buchung nicht gesetzt | getoetet (bestehende Tests) | - | - |
| D-38 | massnahmenBuchen | Journaltext aus applied statt txt vertauscht | getoetet (bestehende Tests) | - | - |
| D-39 | reihenendeBuchen | Drift-Buch nicht ausgebucht | UEBERLEBT: ECHTE LUECKE - Drift-Buch bucht verschwundene Reihen nicht aus: Position und Geld bleiben dauerhaft liegen. | HOCH | teil-D.test.js |
| D-40 | reihenendeBuchen | Momentum-Buch nicht ausgebucht | getoetet (bestehende Tests) | - | - |
| D-41 | reihenendeBuchen | Zeit now + 10 Tage | getoetet (bestehende Tests) | - | - |
| D-42 | reihenendeBuchen | Journal immer als momentum | UEBERLEBT: ECHTE LUECKE - Journaltext nennt beim Drift-Buch "Momentum-Buch". | NIEDRIG | teil-D.test.js |
| D-43 | reihenendeBuchen | geaendert nicht gesetzt | UEBERLEBT: ECHTE LUECKE - Reihenende gebucht, aber nicht gespeichert (Verlust beim Neustart, Doppelbuchung moeglich). | MITTEL | teil-D.test.js |
| D-44 | takt/Reihenende | Reihenende auch bei veralteter Marktreihe | getoetet (bestehende Tests) | - | - |
| D-45 | tagespunkt | gleicher Tag erzeugt zweiten Punkt (< statt <=) | getoetet (bestehende Tests) | - | - |
| D-46 | tagespunkt | Tag des alten Punkts ohne tag um einen Tag verschoben | UEBERLEBT: ECHTE LUECKE - Verlaufspunkt: Tag eines alten Punkts ohne tag verschoben, ein Tagespunkt kann fehlen/doppelt entstehen. | MITTEL | teil-D.test.js |
| D-47 | tagespunkt | Sperre nach Umschichtung >= statt > | UEBERLEBT: ECHTE LUECKE - Punkt am Tag der Umschichtung selbst wird unterdrueckt (Randfall, Verlauf hat eine Luecke). | MITTEL | teil-D.test.js |
| D-48 | tagespunkt | Sperre nach Umschichtung < statt > | getoetet (bestehende Tests) | - | - |
| D-49 | tagespunkt | Schluesse vom Takt-Tag statt vom Punkt-Tag | getoetet (bestehende Tests) | - | - |
| D-50 | tagespunkt | Momentum-Bargeld aktuell statt an X | getoetet (bestehende Tests) | - | - |
| D-51 | tagespunkt | Drift-Bargeld aktuell statt an X | UEBERLEBT: ECHTE LUECKE - Wert des Drift-Buchs im Tagespunkt ohne Rueckrechnung der Ausschuettung nach X (Anzeige/Massstab). | MITTEL | teil-D.test.js |
| D-52 | tagespunkt | buchT = now statt x.t | getoetet (bestehende Tests) | - | - |
| D-53 | tagespunkt | spyT = now statt x.t | getoetet (bestehende Tests) | - | - |
| D-54 | tagespunkt | spy = Schluss des Takts (daten.preise) statt x.kurs | getoetet (bestehende Tests) | - | - |
| D-55 | tagespunkt | startM Fallback 10000 | UEBERLEBT: ECHTE LUECKE - Bezugs-Startkapital im Punkt 10.000 (Fallback) - Prozentstand wieder falsch (+900 %). | MITTEL | teil-D.test.js |
| D-56 | tagespunkt | startD = START_KAPITAL statt null ohne Drift-Buch | UEBERLEBT: ECHTE LUECKE - startD ohne Drift-Buch nicht null. | NIEDRIG | teil-D.test.js |
| D-57 | tagespunkt | drift 0 statt null ohne Buch | UEBERLEBT: ECHTE LUECKE - drift im Punkt 0 statt null ohne Buch. | NIEDRIG | teil-D.test.js |
| D-58 | tagespunkt | Kappung auf 749 statt 750 | UEBERLEBT: ECHTE LUECKE - Verlauf auf 749 statt 750 Punkte gekappt. | NIEDRIG | teil-D.test.js |
| D-59 | tagespunkt | Kappung auf 751 statt 750 | UEBERLEBT: ECHTE LUECKE - Verlauf auf 751 statt 750 Punkte gekappt. | NIEDRIG | teil-D.test.js |
| D-60 | tagespunkt | Marktwert Momentum aus Buch mit mfBuch.cash statt bargeldAm und Positionen | getoetet (bestehende Tests) | - | - |
| D-61 | eroeffnung | Fensterende zwei Tage statt einen | UEBERLEBT: AEQUIVALENT - Im echten Ablauf ist heute = New-Yorker Tag der Uhr, und zerlege schneidet schon bei bis = jetzt ab; das obere Fenster-Ende von eroeffnung ist redundant. Nur ein Direktaufruf mit anderem Tag zeigt es. | - | teil-D.test.js |
| D-62 | eroeffnung | Fensteranfang ein Tag frueher | getoetet (bestehende Tests) | - | - |
| D-63 | eroeffnung | fehlende Eroeffnung (null) wird akzeptiert (>= 0) | UEBERLEBT: ECHTE LUECKE - Balken ohne Eroeffnung liefert { kurs: null }: SPY-Handelstagspruefung gilt als bestanden, obwohl keine Eroeffnung da ist. | MITTEL | teil-D.test.js |
| D-64 | eroeffnung | Schluss statt Eroeffnung als Fuellkurs | getoetet (bestehende Tests) | - | - |
| D-65 | eroeffnung | Balken mit Eroeffnung wird ueber Schluss geprueft | UEBERLEBT: ECHTE LUECKE - Wie D-63 (Pruefung am Schluss statt an der Eroeffnung). | MITTEL | teil-D.test.js |
| D-66 | eroeffnung | spaetester statt frueher Balken | UEBERLEBT: AEQUIVALENT - Interval 1d liefert je Tag hoechstens einen Balken im Fenster; frueh/spaet macht keinen Unterschied. | - | teil-D.test.js |
| D-67 | eroeffnung | Zeitstempel t = von statt Balkenzeit | getoetet (bestehende Tests) | - | - |
| D-68 | eroeffnung | bereinigt:true abgerufen | getoetet (bestehende Tests) | - | - |
| D-69 | eroeffnung | offenRoh:false (fehlende Eroeffnung faellt auf Schluss) | getoetet (bestehende Tests) | - | - |
| D-70 | eroeffnung | bis=Mitternacht statt now im Abruf | getoetet (bestehende Tests) | - | - |
| D-71 | eroeffnung | interval 1h statt 1d | UEBERLEBT: AEQUIVALENT - Stundenbalken: der erste Balken hat dieselbe Eroeffnung und denselben Stempel; Ergebnis gleich. Test pinnt nur den Abrufparameter. | - | teil-D.test.js |
| D-72 | ausfuehrungVorbereiten | Handelsbeginn 09:30 statt HANDEL_AB-Minute | getoetet (bestehende Tests) | - | - |
| D-73 | ausfuehrungVorbereiten | Handelsbeginn 09:00 | getoetet (bestehende Tests) | - | - |
| D-74 | ausfuehrungVorbereiten | now <= statt < Handelsbeginn | UEBERLEBT: ECHTE LUECKE - Genau um 09:35:00 New York wird nicht gehandelt (Randfall einer Sekunde/Minute). | MITTEL | teil-D.test.js |
| D-75 | ausfuehrungVorbereiten | Frische gegen now statt Bestandsstand | getoetet (bestehende Tests) | - | - |
| D-76 | ausfuehrungVorbereiten | Frische mit falschem Tag (Stichtag statt heute) | getoetet (bestehende Tests) | - | - |
| D-77 | ausfuehrungVorbereiten | Ziel auf ungeschnittenen Rohdaten | getoetet (bestehende Tests) | - | - |
| D-78 | ausfuehrungVorbereiten | Ziel mit nowMs = now statt Stichtag | getoetet (bestehende Tests) | - | - |
| D-79 | ausfuehrungVorbereiten | Hinweistext nennt halten statt mindestWerte | UEBERLEBT: ECHTE LUECKE - Hinweistext nennt 63 statt 100 zulaessige Werte. | NIEDRIG | teil-D.test.js |
| D-80 | ausfuehrungVorbereiten | SPY-Handelstagspruefung entfernt | getoetet (bestehende Tests) | - | - |
| D-81 | ausfuehrungVorbereiten | SPY-Eroeffnung vom Stichtag | getoetet (bestehende Tests) | - | - |
| D-82 | ausfuehrungVorbereiten | Wert-Eroeffnungen vom Stichtag | getoetet (bestehende Tests) | - | - |
| D-83 | ausfuehrungVorbereiten | Positionen ausserhalb des Ziels werden nicht bepreist | getoetet (bestehende Tests) | - | - |
| D-84 | ausfuehrungVorbereiten | Ziel-Werte ohne ersten bepreist | UEBERLEBT: ECHTE LUECKE - Das staerkste Ziel bekommt keinen Eroeffnungskurs: es wird nicht gekauft (Ziel ohne Kauf, offener Auftrag). | HOCH | teil-D.test.js |
| D-85 | ausfuehrungVorbereiten | barZeit = now statt Balkenstempel | getoetet (bestehende Tests) | - | - |
| D-86 | ausfuehrungVorbereiten | Rueckgabe heute = Stichtag | UEBERLEBT: ECHTE LUECKE - Ausfuehrungstag = Stichtag: Journal und letzteAusfuehrungTag falsch, Faelligkeit verschoben, offene Auftraege am falschen Tag. | HOCH | teil-D.test.js |
| D-87 | ausfuehrungVorbereiten | Rueckgabe Stichtag = heute | getoetet (bestehende Tests) | - | - |
| D-88 | ausfuehrungVorbereiten | veraltete Marktreihe wird ignoriert | UEBERLEBT: ECHTE LUECKE - Veraltete Marktreihe wird ignoriert: es wird auf alter Marktreihe umgeschichtet. | HOCH | teil-D.test.js |
| D-89 | ausfuehrungVorbereiten | Wochenendsperre ignoriert | UEBERLEBT: ECHTE LUECKE - Wochenendsperre entfernt: am Wochenende nur noch ueber die SPY-Pruefung abgefangen, Hinweistext falsch. | MITTEL | teil-D.test.js |
| D-90 | offenNachfassen | Ende gemeldet, aber nicht zum Speichern gemeldet | getoetet (bestehende Tests) | - | - |
| D-91 | offenNachfassen | Nachfassen auch bei ausgeschaltetem Buch | getoetet (bestehende Tests) | - | - |
| D-92 | offenNachfassen | Eroeffnung vom Folgetag des Auftrags | getoetet (bestehende Tests) | - | - |
| D-93 | offenNachfassen | Kosten 10 statt 20 Bp | getoetet (bestehende Tests) | - | - |
| D-94 | offenNachfassen | Kosten 30 statt 20 Bp | getoetet (bestehende Tests) | - | - |
| D-95 | offenNachfassen | Kleinstanteil nicht durchgereicht | getoetet (bestehende Tests) | - | - |
| D-96 | offenNachfassen | barZeit = now beim Nachfassen | getoetet (bestehende Tests) | - | - |
| D-97 | offenNachfassen | Merker bargeld nie gesetzt | getoetet (bestehende Tests) | - | - |
| D-98 | offenNachfassen | Merker: erster wartender Wert uebersehen | getoetet (bestehende Tests) | - | - |
| D-99 | offenNachfassen | Rueckgabe ohne neuMerker | UEBERLEBT: ECHTE LUECKE - Nachfassen speichert den Merker "Bargeld fehlt" nicht (Rueckgabe false); nach Neustart steht der Grund im Schlusstext nicht mehr. | MITTEL | teil-D.test.js |
| D-100 | offenNachfassen | Merker nur wenn keine wartenden | getoetet (bestehende Tests) | - | - |
| D-101 | offenNachfassen | Journal-Zeile nur bei nicht-z | getoetet (bestehende Tests) | - | - |
| D-102 | takt | Umschichtung auch bei ausgeschaltetem Buch (faellig allein) | getoetet (bestehende Tests) | - | - |
| D-103 | takt | Kosten 10 statt 20 Bp | getoetet (bestehende Tests) | - | - |
| D-104 | takt | Kosten 30 statt 20 Bp | getoetet (bestehende Tests) | - | - |
| D-105 | takt | Kleinstanteil nicht an fuehreAus | getoetet (bestehende Tests) | - | - |
| D-106 | takt | Kleinstanteil nicht an Vorab-Plan | getoetet (bestehende Tests) | - | - |
| D-107 | takt | Kleinstanteil nicht an Ausfuehrungsplan | getoetet (bestehende Tests) | - | - |
| D-108 | takt | Ausfuehrungsplan mit Schlusskursen statt Eroeffnungen | getoetet (bestehende Tests) | - | - |
| D-109 | takt | Ausfuehrungsplan mit Ziel vom Takt statt Stichtag | getoetet (bestehende Tests) | - | - |
| D-110 | takt | Kleinstanteil nicht an offenNachfassen | getoetet (bestehende Tests) | - | - |
| D-111 | takt | Stempel mit Schluss-barZeit statt Eroeffnungs-Balken | getoetet (bestehende Tests) | - | - |
| D-112 | takt | offene Auftraege auch beim Knopf | getoetet (bestehende Tests) | - | - |
| D-113 | takt | offene Auftraege nie gemerkt | getoetet (bestehende Tests) | - | - |
| D-114 | takt | fehltRest: offene Werte nicht ausgeschlossen | UEBERLEBT: ECHTE LUECKE - Journal: offene Auftraege werden zusaetzlich als "nicht handelbar" genannt. | NIEDRIG | teil-D.test.js |
| D-115 | takt | gekauft zaehlt auch stueck 0 | getoetet (bestehende Tests) | - | - |
| D-116 | takt | Kleinstbestaende: Zaehlung ohne plan.kleinst | getoetet (bestehende Tests) | - | - |
| D-117 | takt | Verspaetung fuer Knopf nicht genullt | UEBERLEBT: ECHTE LUECKE - Der Knopf nennt "verspaetet" im Journal. | NIEDRIG | teil-D.test.js |
| D-118 | takt | letztesRebalanceT nicht gesetzt | UEBERLEBT: ECHTE LUECKE - letztesRebalanceT wird nach der Umschichtung nicht gesetzt (Anzeige "letzte", Altbuch-Ableitung). | MITTEL | teil-D.test.js |
| D-119 | takt | letzteAusfuehrungTag = Stichtag | getoetet (bestehende Tests) | - | - |
| D-120 | takt | letzteAusfuehrungTag nicht gesetzt | getoetet (bestehende Tests) | - | - |
| D-121 | takt | Faelligkeit: halten - 1 | UEBERLEBT: ECHTE LUECKE - Umschichtung einen Handelstag zu frueh (61 statt 62 Balken). | HOCH | teil-D.test.js |
| D-122 | takt | Faelligkeit: halten + 1 | UEBERLEBT: ECHTE LUECKE - Umschichtung einen Handelstag zu spaet (63 statt 62 Balken). | HOCH | teil-D.test.js |
| D-123 | takt | Faelligkeit nach Umschichtung nicht neu gerechnet | getoetet (bestehende Tests) | - | - |
| D-124 | takt | faellig bleibt nach Umschichtung true | UEBERLEBT: ECHTE LUECKE - Karte zeigt nach der Umschichtung weiter "Rebalancing faellig". | NIEDRIG | teil-D.test.js |
| D-125 | takt | liquideSeit wird bei jeder Umschichtung ueberschrieben | getoetet (bestehende Tests) | - | - |
| D-126 | takt | korbVerlauf: ziel = Zahl der Kaeufe | UEBERLEBT: ECHTE LUECKE - korbVerlauf: Zielzahl falsch (nachrichtlich). | NIEDRIG | teil-D.test.js |
| D-127 | takt | korbVerlauf zulaessig/geprueft vertauscht | UEBERLEBT: ECHTE LUECKE - korbVerlauf: zulaessig/geprueft vertauscht (nachrichtlich). | NIEDRIG | teil-D.test.js |
| D-128 | takt | korbVerlauf Kappung 119 | UEBERLEBT: ECHTE LUECKE - korbVerlauf 119 statt 120 Eintraege. | NIEDRIG | teil-D.test.js |
| D-129 | takt | Altbuch: letzteAusfuehrungTag auch bei vorhandenem Tag gesetzt (||) | getoetet (bestehende Tests) | - | - |
| D-130 | takt | Altbuch: NY-Tag von now statt letztesRebalanceT | getoetet (bestehende Tests) | - | - |
| D-131 | takt | Ziel mit now statt juengstem Balken | getoetet (bestehende Tests) | - | - |
| D-132 | takt | Nachladen bei ohneUmsatz-Haelfte: > statt >= | UEBERLEBT: ECHTE LUECKE - Nachladen bei genau 50 % ohne Stueckzahlen unterbleibt. | NIEDRIG | teil-D.test.js |
| D-133 | takt | Journal: Verkaeufe = nM - gekauft + 1 | getoetet (bestehende Tests) | - | - |
| D-134 | takt | Journal: Kosten-Text 10 Bp | UEBERLEBT: ECHTE LUECKE - Journaltext "Kosten 10 Bp" bei tatsaechlich 20 Bp (Zahl, die der Anwender sieht). | NIEDRIG | teil-D.test.js |
| D-135 | nachladen | Sperre 6 Minuten statt 1 Stunde | UEBERLEBT: ECHTE LUECKE - Nachladen alle 6 Minuten statt hoechstens je Stunde (Netzlast/Drosselung). | NIEDRIG | teil-D.test.js |
| D-136 | kurseFrischHalten | Frische-Pruefung entfernt | UEBERLEBT: ECHTE LUECKE - Frische-Pruefung entfaellt: bei jedem Takt wird neu geladen (Drosselung, 193 Werte). | MITTEL | teil-D.test.js |
| D-137 | kurseFrischHalten | Nachladen auch wenn frisch | UEBERLEBT: ECHTE LUECKE - Umgekehrt: veraltete Kurse werden nicht nachgeladen. | MITTEL | teil-D.test.js |
| D-138 | ladeKurse | Preis = vorletzter Balken | getoetet (bestehende Tests) | - | - |
| D-139 | ladeKurse | barZeit = erster Balken | getoetet (bestehende Tests) | - | - |
| D-140 | ladeKurse | juengster: kleinster statt groesster | getoetet (bestehende Tests) | - | - |
| D-141 | ladeKurse | spalte4: 3 Spalten genuegen | UEBERLEBT: ECHTE LUECKE - Bestand ohne vierte Spalte wird nicht erkannt (kein einmaliges Neuladen). | NIEDRIG | teil-D.test.js |
| D-142 | ladeKurse | Bezug ohne Laengenpruefung | getoetet (bestehende Tests) | - | - |
| D-143 | ladeKurse | stand ohne at = Date.now | UEBERLEBT: ECHTE LUECKE - Fehlende Ladezeit gilt als "jetzt" statt 0 - ein Bestand ohne at wirkt frisch. | NIEDRIG | teil-D.test.js |
| D-144 | kursOk | 0 gilt als Kurs (>= 0) | getoetet (bestehende Tests) | - | - |
| D-145 | kursOk | isFinite entfernt | getoetet (bestehende Tests) | - | - |
| D-146 | kursOk | typeof entfernt | getoetet (bestehende Tests) | - | - |
| D-147 | ereignisseAus | Zeit in 100 statt 1000 | getoetet (bestehende Tests) | - | - |
| D-148 | ereignisseAus | Schluessel statt Feld date bevorzugt | UEBERLEBT: AEQUIVALENT - Bei Yahoo ist der Schluessel gleich dem Feld date; nur ein kuenstlicher Fall mit date != Schluessel zeigt es. | - | teil-D.test.js |
| D-149 | ereignisseAus | Betrag nicht geprueft | getoetet (bestehende Tests) | - | - |
| D-150 | ereignisseAus | Split mit z = n bleibt | getoetet (bestehende Tests) | - | - |
| D-151 | ereignisseAus | Split Zaehler/Nenner vertauscht | getoetet (bestehende Tests) | - | - |
| D-152 | ereignisseAus | Split ohne Nenner-Pruefung | getoetet (bestehende Tests) | - | - |
| D-153 | ereignisseAus | Fenster ohne untere Grenze einschliessend (> statt >=) | UEBERLEBT: AEQUIVALENT - Fenster von = 0 in allen Aufrufern; Grenzfall genau auf von nicht erreichbar. | - | teil-D.test.js |
| D-154 | ereignisseAus | Fenster obere Grenze ausschliessend | UEBERLEBT: ECHTE LUECKE - Ereignis genau auf der Millisekunde bis = jetzt faellt heraus (praktisch nie). | NIEDRIG | teil-D.test.js |
| D-155 | ereignisseAus | Fenster nur wenn eine Grenze fehlt (|| statt &&) | UEBERLEBT: AEQUIVALENT - Alle Aufrufer geben von und bis zusammen oder keins. | - | teil-D.test.js |
| D-156 | ereignisseAus | Sortierung absteigend | getoetet (bestehende Tests) | - | - |
| D-157 | ereignisseAus | Dividenden nicht sortiert | UEBERLEBT: AEQUIVALENT - Ganzzahlige Schluessel durchlaufen Object.keys aufsteigend; bei date = Schluessel ist die Liste schon sortiert. | - | teil-D.test.js |
| D-158 | ereignisseAus | Splits nicht sortiert | UEBERLEBT: AEQUIVALENT - Wie D-157. | - | teil-D.test.js |
| D-159 | ereignisseAus | Splits ohne Fensterfilter | UEBERLEBT: ECHTE LUECKE - Splits ausserhalb des Fensters (z. B. nach "bis") werden gebucht. | MITTEL | teil-D.test.js |
| D-160 | ereignisseAb | ab-Grenze ausschliessend | getoetet (bestehende Tests) | - | - |
| D-161 | ereignisseAb | nur Dividenden gefiltert | UEBERLEBT: ECHTE LUECKE - ereignisseAb filtert die Splits nicht: alte Splits in der Ablage, werden spaeter gegen Kaufzeit geprueft - Randfall. | MITTEL | teil-D.test.js |
| D-162 | zerlege | bereinigt invertiert | getoetet (bestehende Tests) | - | - |
| D-163 | zerlege | feld bleibt close trotz adjclose | getoetet (bestehende Tests) | - | - |
| D-164 | zerlege | Roh-Schluss ohne kursOk | UEBERLEBT: ECHTE LUECKE - Roh-Reihe ohne kursOk: 0/NaN-Schluesse landen im Ausschuettungsfaktor des Massstabs. | MITTEL | teil-D.test.js |
| D-165 | zerlege | Roh-Zeitstempel in Sekunden | getoetet (bestehende Tests) | - | - |
| D-166 | zerlege | Balken-Zeitstempel in Sekunden | getoetet (bestehende Tests) | - | - |
| D-167 | zerlege | Hoch/Tief nicht getauscht | getoetet (bestehende Tests) | - | - |
| D-168 | zerlege | Hoch/Tief Reihenfolge im Balken vertauscht | getoetet (bestehende Tests) | - | - |
| D-169 | zerlege | Eroeffnung faellt immer auf Schluss (offenRoh ignoriert) | getoetet (bestehende Tests) | - | - |
| D-170 | zerlege | Eroeffnung bleibt immer leer | getoetet (bestehende Tests) | - | - |
| D-171 | zerlege | Volumen nicht auf 0 gesetzt | getoetet (bestehende Tests) | - | - |
| D-172 | zerlege | Hoch faellt nicht auf Schluss | getoetet (bestehende Tests) | - | - |
| D-173 | zerlege | Tief faellt auf Hoch statt Schluss | UEBERLEBT: ECHTE LUECKE - Tief faellt auf Hoch statt Schluss (nur Intraday-Anzeige). | NIEDRIG | teil-D.test.js |
| D-174 | zerlege | verworfen nicht gezaehlt | getoetet (bestehende Tests) | - | - |
| D-175 | zerlege | kaputter Kurs wird nicht verworfen (nur null) | getoetet (bestehende Tests) | - | - |
| D-176 | zerlege | Fenster Balken: untere Grenze ausschliessend | getoetet (bestehende Tests) | - | - |
| D-177 | zerlege | Fenster Balken: obere Grenze ausschliessend | getoetet (bestehende Tests) | - | - |
| D-178 | zerlege | Fenster Rohreihe: obere Grenze ausschliessend | UEBERLEBT: AEQUIVALENT - Grenzfall genau bis = jetzt in der Rohreihe (wie D-154), praktisch nie. | - | teil-D.test.js |
| D-179 | zerlege | Fenster Rohreihe: nicht gefiltert | getoetet (bestehende Tests) | - | - |
| D-180 | zerlege | Fenster nur bei von UND bis -> oder | UEBERLEBT: AEQUIVALENT - Aufrufer geben von und bis zusammen an (wie D-155). | - | teil-D.test.js |
| D-181 | zerlege | ausserhalbFenster falsch gezaehlt | getoetet (bestehende Tests) | - | - |
| D-182 | zerlege | gesamt = bars.length | getoetet (bestehende Tests) | - | - |
| D-183 | zerlege | ereignisse immer | getoetet (bestehende Tests) | - | - |
| D-184 | zerlege | roh nie zurueck | UEBERLEBT: ECHTE LUECKE - roh wird nie zurueckgegeben: der Massstab verliert den Ausschuettungsfaktor, Marktvergleich falsch. | MITTEL | teil-D.test.js |
| D-185 | zerlege | roh immer als Liste (mitRoh ignoriert) | getoetet (bestehende Tests) | - | - |
| D-186 | zerlege | ereignisse mit o ohne Fenster | getoetet (bestehende Tests) | - | - |
| D-187 | zerlege | adjclose-Pruefung: leere Liste genuegt | UEBERLEBT: ECHTE LUECKE - Leere adjclose-Liste gilt als vorhanden: alle Balken verworfen statt Rueckfall auf close. | MITTEL | teil-D.test.js |
| D-188 | reihe | Volumen statt Schluss | UEBERLEBT: ECHTE LUECKE - reihe() liefert Volumen statt Schluss - jeder Aufrufer bekaeme falsche Kurse. | MITTEL | teil-D.test.js |
| D-189 | url | period1 aufgerundet | UEBERLEBT: AEQUIVALENT - period1 aus von = 0 oder voller Sekunde; Aufrunden aendert nur bei Millisekundenanteil, den kein Aufrufer setzt. | - | teil-D.test.js |
| D-190 | url | Ereignisse nur Dividenden | getoetet (bestehende Tests) | - | - |
| D-191 | ausfuehrungVorbereiten | Ausfuehrungstag nach UTC statt New York | UEBERLEBT: ECHTE LUECKE - Abends nach 19:00 New York (UTC schon morgen) wird der Ausfuehrungstag falsch (UTC) gebildet. | MITTEL | teil-D.test.js |
| D-192 | tagespunkt | Schreibtag eines alten Punkts nach UTC statt New York | UEBERLEBT: ECHTE LUECKE - Alter Punkt: Schreibtag nach UTC statt New York. | NIEDRIG | teil-D.test.js |
| D-193 | takt | Ausfuehrungstag des Altbuchs nach UTC statt New York | getoetet (bestehende Tests) | - | - |
| D-194 | eroeffnung | Fehler beim Abruf wird weitergereicht statt null | UEBERLEBT: ECHTE LUECKE - Ein Abrufausfall bricht die ganze Umschichtung ab statt den Wert auszulassen. | MITTEL | teil-D.test.js |
| D-195 | tagespunkt | Kappung erst ab 7500 Punkten | UEBERLEBT: ECHTE LUECKE - Verlauf wird nicht mehr gekappt (Speicherwachstum). | NIEDRIG | teil-D.test.js |
| D-196 | tagespunkt | Kappung ab >= 750 statt > 750 (vermutlich aequivalent) | getoetet (bestehende Tests) | - | - |
| D-197 | takt | Korbverlauf-Kappung >= 120 statt > 120 (vermutlich aequivalent) | UEBERLEBT: AEQUIVALENT - Bei genau 120 Eintraegen ergibt slice(-120) dieselbe Liste; die Kopie ersetzt nur das Array. Kein Test kann das sehen (siehe Nachlauf). | - | keiner (aequivalent) |
| D-198 | tagespunkt | Marktstand-Preis x.kurs aus Bezug Spalte 1 ok; Tag X = juengster statt vorheriger (Bedingung <= statt <) | getoetet (bestehende Tests) | - | - |
| D-199 | offenNachfassen | offenBeenden wird mit Uhr + 6 Stunden gefragt | getoetet (bestehende Tests) | - | - |
| D-200 | massnahmenBuchen | Journal-Kennung ohne Buchnamen | getoetet (bestehende Tests) | - | - |
| D-201 | reihenendeBuchen | Journal-Kennung ohne Wert | UEBERLEBT: ECHTE LUECKE - Journal-Kennung ohne Wertnamen: zwei Reihenenden im selben Takt haetten dieselbe Kennung. | NIEDRIG | teil-D.test.js |
| D-202 | ausfuehrungVorbereiten | Wartezeit 90 ms entfernt (Tempo) | UEBERLEBT: ECHTE LUECKE - Pause zwischen den Eroeffnungs-Abrufen entfaellt (Drosselung durch Yahoo ab ~200 Abrufen). | NIEDRIG | teil-D.test.js |

## Anmerkungen (kein Mutant, nur berichtet)

1. `Kurse.url()` baut bei fehlendem `range` und nur einer Grenze `?range=undefined` (geprueft: `url("X",{von:1000,interval:"1d"})`). Kein heutiger Aufrufer erreicht das; ein Aufruf mit nur `von` oder `bis` schluege still fehl.
2. `zerlege` filtert nur, wenn `von` UND `bis` gesetzt sind; bei einer Grenze keine Sperre der Abschlusskerze (Zeile 187) - siehe D-180/D-155, im Betrieb nicht erreichbar.
3. `buchInit` ist von keinem bestehenden Test beruehrt, obwohl es Startkapital und den Beginn des Vorwaertstests setzt (D-01..D-06).
4. Die Pause `setTimeout(w, 90)` zwischen den Eroeffnungs-Abrufen steht in `ausfuehrungVorbereiten` und `offenNachfassen`; ohne sie laeuft ein Takt mit ~120 Werten in Sekunden gegen Yahoo (Drosselung). Der Test prueft sie nur fuer `ausfuehrungVorbereiten`.
5. `eroeffnung` bricht bei einem Abrufausfall nicht ab (try/catch -> null); ein Wert ohne Kurs wird dann als offener Auftrag gefuehrt - gewollt, aber nur ueber D-194 geschuetzt.
6. Der Faelligkeitsrand haengt an `MFHandel.faelligkeit` (n >= halten - 1); der Takt uebergibt `KONFIG.halten` und ruft die Funktion nach der Umschichtung ein zweites Mal - beides jetzt geprueft.
