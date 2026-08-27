# Lagebild Intraday-Datenbestand

Stand der Messung: 27. August 2026, 16:00 bis 16:15 UTC, das sind 12:00 bis 12:14 New Yorker Handelszeit.

## 1. Gesamtlage

Kein einziger Handelstag fehlt in den vier Intraday-Archiven, aber der laufende Tag fehlt in drei von vier Archiven, der Nachmittag des 26. August fehlt bei knapp der Hälfte des Universums, und die Minutendaten tragen zwei stille Fehler, die kein Zähler bemerkt: verlorene Vollstunden-Minuten bei 489 Reihen und um das Drei- bis Fünffache aufgeblähte Umsätze bei rund einem Drittel.

## 2. Die vier Archive

| Archiv | Reihen | Abgedeckte Spanne | Heutiger Tag (27.8.) | Abdeckung innerhalb eines Tages bei liquiden Werten |
|---|---|---|---|---|
| 1 Minute | 2.995 (2.964 + 31 ETF) | 18.–26.8.2026, 7 Handelstage | Nein: 0 von 2.995 Reihen | AAPL, MSFT, NVDA je 384 von 390 (98,5 %); SPY, QQQ, IWM, VOO, GLD je 390 von 390 (100 %); Querschnitt Median 83,8 % |
| 5 Minuten | 522 (491 + 31 ETF) | 2.6.–26.8.2026, 60 Handelstage | Nein: 0 von 522 Reihen | An 59 der 60 Tage exakt 78 von 78 (100 %); nur der 26.8. abgeschnitten (38 von 78) |
| 15 Minuten | 522 (491 + 31 ETF) | 2.6.–26.8.2026, 60 Handelstage | Nein: 0 von 522 Reihen | An allen abgeschlossenen Tagen 26 von 26 (100 %) |
| 60 Minuten | 2.916 (2.885 + 31 ETF) | 26.9.2023–26.8.2026, 732 Handelstage | Ja, und zwar während der Messung entstehend: 601 von 2.916 um 12:14 New Yorker Zeit | An 723 der 732 Tage 7 von 7 (100 %); Füllgrad im Querschnitt 99,852 % |

Zuerst gemessen: der 27. August fehle auch im Stundenarchiv. Gegenprobe ergab: dort lief zum Messzeitpunkt seit 11:52 New Yorker Zeit ein Sammellauf über alle 2.916 Werte, der die Zahl der Reihen mit heutiger Kerze binnen 14 Minuten von 218 auf 601 hochzog.

Zwei Zusatzbefunde zur Tabelle:

- Der 26. August ist bei einem großen Teil des Universums mitten am Tag abgeschnitten: im Minutenarchiv bei 1.346 von 2.960 Reihen (45,5 %), im 5-Minuten-Archiv bei allen 489 Hauptreihen (der Tag ist zu 50,3 % gefüllt, Abbruch gegen 12:40 New Yorker Zeit), im 15-Minuten-Archiv bei 234 von 491 Reihen (47,7 %).
- Im 15-Minuten-Archiv ist der Bestand gespalten: 259 Reihen wurden heute früh nachgeführt, 234 stehen seit dem 26. August still. Darunter ausgerechnet SPY, dessen letzte Kerze vom 26.8. 14:45 New Yorker Zeit stammt.

## 3. Was fehlt, und ob es nachholbar ist

### (a) Nachholbar

- **Der heutige 27. August in den Archiven 1, 5 und 15 Minuten.** Jeder Abruf holt grundsätzlich das ganze Quellfenster (Minutendaten 7 Tage, 5 und 15 Minuten 60 Tage) und fügt es mit dem Vorhandenen zusammen. Der nächste planmäßige Lauf steht am 28. August um 02:00 deutscher Zeit an, das sind 20:00 New Yorker Zeit und damit nach Handelsschluss. Ein zweiter, unabhängiger Auslöser greift am 1. September. Frist für die Minutendaten: der 27. August bleibt bei der Quelle bis etwa zum 3. September abrufbar.
- **Der abgeschnittene Nachmittag des 26. August** in allen drei genannten Archiven. Er liegt in allen Fenstern und kommt beim nächsten Lauf mit.
- **Die 234 stehengebliebenen 15-Minuten-Reihen samt SPY.** Der Abstand je Wert beträgt bei 5 und 15 Minuten sieben Tage, es steht an einem Tag also planmäßig nur ein Teil des Universums an. Ob diese Reihen turnusmäßig wieder drankommen oder dauerhaft herausgefallen sind, ist aus den Archiven allein nicht entscheidbar.
- **Die 354 im Stundenarchiv ganz fehlenden Symbole** liegen mit 730 Tagen Quellfenster grundsätzlich in Reichweite. Ob sie sich holen lassen, ist offen: bei 234 antwortete die Quelle mit "Kürzel unbekannt", bei 84 mit einem anderen Ablehnungscode, bei 33 mit zu wenigen Kerzen.
- **Die verlorenen Vollstunden-Minuten der 489 Minutenreihen**, soweit die betroffenen Tage noch im Sieben-Tage-Fenster liegen. Wie viele der sieben Tage das heute noch sind, ist nicht gemessen. Ob ein neuer Lauf sie zurückbringt oder erneut entfernt, ist ebenfalls nicht gemessen: der Lauf, der sie entfernt hat, war selbst ein regulärer, als erfolgreich gemeldeter Abruf.

### (b) Unwiederbringlich, wenn nicht bald gesammelt wird

- **Minutendaten haben genau 7 Tage Halbwertszeit.** Gemessen an 330 von 2.964 Dateien: die Herkunftskennung ist in 330 von 330 Fällen dieselbe Sieben-Tage-Abfrage, kein Wert enthält mehr als 7 verschiedene Datumstage, die Kalenderspanne beträgt 8,27 Tage. Was nach Ablauf des Fensters nicht im Archiv steht, gibt die Quelle nicht mehr her.
- **Betroffen sind rund 2.760 der 2.964 Werte.** Für sie existiert keine zweite Quelle und keine Sicherung. Das vorhandene Sicherungswerkzeug lässt Kursdaten ausdrücklich aus, mit der Begründung, sie seien jederzeit nachladbar. Für Minutendaten stimmt diese Begründung nicht.
- Zuerst behauptet: was aus dem Fenster fällt, sei ausnahmslos unwiederbringlich fort. Gegenprobe ergab: für das Mess-Universum von rund 200 Werten füllt ein zweiter Anbieter (Capital.com) nachts bis zu 90 Tage zurück. 133 von 199 geprüften Dateien im Programmspeicher tragen dessen Marke, Median 62 abgedeckte Tage, älteste Kerze 26. Mai 2026. Einschränkung: diese Rettung ist kursgültig, aber volumenungültig, die Umsätze weichen um den Faktor rund 500 ab, weil es Differenzkontrakt-Daten sind statt Börsenumsätzen.
- **Konkrete Folge:** bliebe die Sammlung mehrere Tage aus, fielen ab etwa dem 3. September die Minutendaten des 27. August für alle 2.964 Werte endgültig weg. Für die rund 200 Werte des Mess-Universums blieben die Kurse erhalten, die Umsätze nicht.
- **Bereits fort: die 12:30-Kerze an allen sieben halben Handelstagen** im Stundenarchiv. Gemessen fehlen dort nicht nur ein Rasterplatz, sondern rund 23,6 % des Tagesumsatzes (Verhältnis der Umsatzquoten Halbtag zu Normaltag: 0,764). Ob ein neuer Abruf die Kerze liefern würde, ist nicht gemessen; die zwei ältesten dieser Tage liegen rechnerisch ohnehin außerhalb des Zwei-Jahres-Fensters.

### (c) Harmlos oder erklärbar

- **Kein einziger fehlender Handelstag.** Gegen einen eigens gerechneten Börsenkalender geprüft: 733 erwartete Handelstage, 733 vorhanden, 0 fehlend, 0 unerwartet. Die fehlenden Werktage sind ausnahmslos Feiertage (19. Juni, 3. Juli, Karfreitag 3. April, Trauertag 9. Januar 2025). Keine Kerze fällt auf ein Wochenende. Auch der Verdacht, die Tagesgrenzen seien durch Zeitzonen verschoben, ist widerlegt: bei 0 von 10.078 Tages- und 0 von 5.107 Stundenkerzen weicht das Datum nach Weltzeit vom Datum nach New Yorker Zeit ab.
- **Der Grund für den fehlenden heutigen Tag ist kein Datenfehler der Quelle, sondern die Uhrzeit.** Alle drei Läufe von heute liefen vor der US-Eröffnung: Minutendaten 12:01 bis 12:18, 5 Minuten 12:20, 15 Minuten 12:40 deutscher Zeit, das sind 06:01 bis 06:40 New Yorker Zeit. Das Programm sammelt planmäßig nur bei geschlossener Börse, weil die Quelle fertige Kerzen noch etwa 18 Minuten lang rückwirkend korrigiert.
- **Die 16:00-Stempelkerzen** (Umsatz 0, alle vier Kurse gleich): 210 von 371 geprüften Minutenreihen, 295 im 15-Minuten-Archiv, je eine bei den 31 ETF-Reihen im 5-Minuten-Archiv, 409 in der Stundenstichprobe an zwei Tagen. Bekannte Form, kein Handel.
- **Dünne Minutenreihen sind wirklich illiquide, kein Sammelfehler.** Reihen mit 100 bis 194 von 390 Kerzen fangen im Median 88,7 % des Tagesumsatzes ein, Reihen mit 384 bis 390 Kerzen 93,1 %. Die fehlenden Minuten tragen praktisch keinen Umsatz.
- **Vor- und Nachbörse fehlen bewusst.** 0,028 % der Minutenkerzen liegen außerhalb 09:30 bis 15:59, und das sind ausnahmslos die 16:00-Stempel. Für alles, was Eröffnungslücken oder vorbörsliche Bewegung braucht, ist dieses Archiv damit nicht die Grundlage.
- **Keine kaputten Dateien.** 0 leere Dateien, 0 Lesefehler, 0 falsch gebaute Kerzen, 0 doppelte oder unsortierte Zeitstempel, geprüft über 2,27 Millionen Kerzen im 5-Minuten-Archiv, 808.965 im 15-Minuten-Archiv und die Stichproben der Minuten- und Stundenarchive.
- **Zwei tote Reihen** (EA endet am 4. August, AVB am 14. August) und 37 kurze Reihen im Stundenarchiv sind Neulistungen oder Kürzelwechsel, keine abgerissenen Reihen. Sie brechen schlagartig ab, sie dünnen nicht aus.
- **Das Testsymbol ZVZZT** liegt mit 306 Kerzen im Minuten-Universum. Es handelt nicht und gehört in keine Auswertung.

### Dazu: nicht fehlend, sondern falsch

Diese Befunde sind keine Lücken, sondern Daten, die vorhanden und unzutreffend sind. Ein Zähler meldet sie als vollständig.

1. **Aufgeblähte Minutenumsätze bei rund einem Drittel des Universums.** Am 25. August weichen 416 von 489 gemeinsamen Reihen um mehr als 1 % vom 5-Minuten-Archiv ab, 149 davon um mehr als das Anderthalbfache. AAPL 4,1-fach, NVDA 5,5-fach, SPY 3,2-fach, SGOV 16,4-fach. Ursache: einzelne Minuten tragen den bis dahin aufgelaufenen Tagesumsatz statt des Minutenumsatzes. Tagesabhängig: 21. August 39,5 % der Reihen, 24. August 16,2 %, 25. August 33,5 %. Der vorhandene Stempelfilter greift nicht, weil 92,7 % dieser Kerzen nicht flach sind. Zur Einordnung: 5-, 15- und 60-Minuten-Umsätze stimmen untereinander exakt überein (Median 1,000000).
2. **489 Minutenreihen haben rückwirkend über alle sieben Tage die Kerzen der vollen Stunden verloren** (10:00, 11:00, 12:00, 13:00, 14:00, 15:00), also 6 von 390 Kerzen je Tag oder 1,54 % des regulären Handels. Der ursprüngliche Bericht konnte den Vorher-Zustand nicht lesen und hat das offengelegt; die Gegenprobe hat ihn gefunden: das 5-Minuten-Archiv wurde zuletzt vor diesem Lauf geschrieben und ist damit der Vorher-Zustand. Gepaart über 489 Reihen erreicht der Umsatz der Vollstunden-Eimer nur 79,38 % des erwarteten Werts, Fehlbetrag 20,6 Prozentpunkte gegen rechnerisch erwartete 20,0 %, während der Kontroll-Eimer exakt 100,00 % erreicht. Es waren also echte Kerzen mit normalem Umsatz. Von 134 geprüften Reihen mit Stand 27. August hat keine einzige eine Vollstunden-Kerze, von 607 Reihen mit Stand 26. August haben 606 sie. Die 31 ETF-Reihen, im selben Lauf und in derselben Minute geschrieben, haben alle behalten. "Die Quelle hat nicht geliefert" ist damit ausgeschlossen.
3. **Splits im Stundenarchiv: der Kurs ist angepasst, der Umsatz nicht.** Volumensprung am Splittag: NVDA 6,68-fach, CMG 47,26-fach, AVGO 6,52, LRCX 5,36, MSTR 6,41, WMT 1,64 - bei einem Kursfaktor von 0,93 bis 1,04. Im Tagesarchiv sind dieselben Werte unauffällig (0,47 bis 0,77). Folge: Stunden- und Tagesumsätze desselben Werts sind über ein Splitdatum hinweg um den Splitfaktor unvergleichbar, und ein Liquiditätsfilter sieht NVDA vor Juni 2024 zehnfach zu klein.
4. **Ein Stempel mit falschem Kurs.** AVB schließt im 5-Minuten-Archiv mit 184,06 direkt nach einer echten Kerze bei 65,91, ein Scheinsprung von +179 %.
5. **Die heute laufende Stundensammlung entsteht bereits mit demselben Umsatzfehler.** In der 10:30-Stunde liegen 11,9 % von 648 geprüften Reihen über dem Dreifachen des üblichen Werts (AAPL 4,4-fach, ABT 3,3-fach), der Median ist mit 0,97 unauffällig.
6. **87 Symbole haben vollständige Tagesdaten, aber keine Stundendaten**, zusammen 10,43 Milliarden Dollar Median-Tagesumsatz. 19 davon über 100 Millionen Dollar am Tag, drei über einer Milliarde: GEV 2,03 Mrd., IBIT 1,45 Mrd., ALAB 1,22 Mrd. Darunter TSN mit 10.078 Tageskerzen, also kein Neuling.
7. **Das Tagesarchiv enthält keinen einzigen ETF** und hat auch keinen ETF-Unterordner. 38 Symbole liegen im Minuten-, aber nicht im Tagesarchiv. Der SPY-über-EMA200-Filter ist aus dem Tagesarchiv nicht rechenbar.

## 4. Reichweite der Aussagen

**Vollständig gezählt (keine Stichprobe):**

- Der letzte enthaltene Tag jeder einzelnen Datei in allen vier Intraday-Archiven und im Tagesarchiv. Die Aussage "heute fehlt" beruht damit auf einer Vollzählung, nicht auf einer Stichprobe. Gezielte Kontrolle der elf liquidesten Werte bestätigt sie.
- Das 5-Minuten-Archiv: alle 491 Reihen, 2.269.386 Kerzen.
- Das 15-Minuten-Archiv: alle 522 Reihen, 808.965 Kerzen.
- Der Bestand an Reihen und der Abgleich der Archive gegeneinander.

**Nur stichprobenweise gemessen:**

- Minutenarchiv: Tagesabdeckung an 371 Reihen, der Querschnitt später an 988 Reihen nachgezählt; Formatprüfung an 371 vollständig gelesenen Dateien.
- Stundenarchiv: Tagesliste an 321 Reihen, Rasterfüllgrad an 207 Reihen, jeweils gleichmäßig über das Alphabet verteilt.

**Nicht gemessen:**

- Wie viele der sieben Minutentage heute noch im Quellfenster liegen und damit reparabel sind.
- Ob ein neuer Lauf die verlorenen Vollstunden-Kerzen zurückbringt oder erneut entfernt.
- Ob ein neuer Lauf die aufgeblähten Umsätze überschreibt oder stehen lässt.
- Ob die 234 stehengebliebenen 15-Minuten-Reihen turnusmäßig wieder drankommen.
- Warum der heutige 5-Minuten-Lauf genau die 31 ETF-Werte einplante.
- Die Lauf-Historie. Das Laufprotokoll hält je Archiv nur den jeweils letzten Lauf; das Stundenarchiv hat gar keins. Frühere Sammelläufe und ausgefallene Läufe sind nachträglich nicht rekonstruierbar.
- Ob ein dritter Anbieter Minutendaten liefern könnte. Die Schnittstelle sähe es der Form nach vor, aber kein Aufruf im System fragt Minutendaten dort an, und getestet wurde es nicht.
- Eine Tageszählung über alle 2.916 Stundenreihen (nur Stichprobe).
- Ob sich die 354 fehlenden Stunden-Symbole unter anderer Schreibweise doch abrufen ließen.

**Korrekturen der Gegenprobe (der jeweils erste Wert war falsch):**

- Zuerst gemessen: im Minutenarchiv erreichen 19,1 % der Reihen mindestens 380 von 390 Kerzen und 20,5 % liegen unter der Hälfte. Gegenprobe mit fast dreifacher Stichprobe ergab: 23,2 % beziehungsweise 16,3 %; die Median-Abdeckung liegt bei 83,8 % statt 82,8 %.
- Zuerst gemessen: 354 fehlende Stunden-Symbole seien 10,83 % eines Universums von 3.270. Gegenprobe ergab: das Universum umfasst 3.264, weil sechs Symbole gleichzeitig als fertig und als fehlend geführt werden. Die Fortschrittsliste widerspricht sich also selbst.
- Zuerst gemessen: fünf Stundenreihen mit veraltetem letzten Tag. Gegenprobe ergab sechs (AVB, EQR, LBRDA, LBRDK, WBS, TWO).
- Zuerst gemessen: 232 von 491 abgeschnittenen 15-Minuten-Reihen (47,3 %). Gegenprobe ergab 234 (47,7 %).
- Zuerst gemessen: der 27. August fehle in allen vier Archiven. Gegenprobe ergab: im Stundenarchiv lief er gerade ein (siehe Abschnitt 2).

**Eine Messfalle, die beim Prüfen selbst auffiel:** Der Vergleich "Summe der Intraday-Umsätze gegen Tagesumsatz" hat einen Median von 0,83 statt 1,0, weil der Tagesumsatz außerbörsliche Abschlüsse enthält. Wer gegen 1,0 prüft, meldet 43 % aller Tag-Reihe-Paare als fehlerhaft und findet einen Scheinfehler. Ebenso ergab ein Vergleich mit ungleichen Fensterrändern zunächst 11,8 % Abweichung bei allen 200 geprüften Reihen; mit sauberen Rändern ist der Median exakt 1,000000. Belastbar sind nur Vergleiche zwischen zwei Archiven mit identischen Rändern.

## 5. Offene Fragen

1. Sollen Auswertungen, die Umsätze auf Minutenbasis benutzen (Liquiditätsfilter, Volumenspitzen, volumengewichtete Kurse), bis zur Klärung als unbrauchbar gelten - und wenn ja, welche der bereits gelaufenen Messungen fallen darunter?
2. Ist es hinnehmbar, dass ein regulärer Sammellauf bereits korrekt gesammelte Historie verkürzen kann, oder soll die Minutensammlung ruhen, bis die korrigierte Programmfassung ausgeliefert ist? Die Fassung, die heute Nacht sammelt, ist die alte.
3. Wie viel Tiefe sollen die Minutendaten haben? Heute stehen rund 200 Werte 62 Tage tief (kursgültig, umsatzungültig) und rund 2.760 Werte 7 Tage tief ohne jede zweite Quelle. Ist eine Rettung ohne gültiges Volumen für die geplanten Auswertungen brauchbar?
4. Sollen die 87 fehlenden Stunden-Symbole mit zusammen 10,43 Milliarden Dollar Tagesumsatz nachgeholt werden, und müssen die bisherigen Ergebnisse auf Stundenbasis auf Überlebensverzerrung nachgeprüft werden? Neun von zwölf Strategien laufen auf diesem Archiv.
5. Aus welcher Quelle soll der SPY-über-EMA200-Filter rechnen, solange das Tagesarchiv keine ETFs enthält?
6. Welches Archiv gilt beim Umsatz als maßgeblich, solange Stunden- und Tagesumsätze über ein Splitdatum hinweg um den Splitfaktor auseinanderliegen (bei CMG Faktor 50)?
7. Sollen die sieben halben Handelstage aus Messungen ausgeschlossen werden, wenn dort rund 23,6 % des Tagesumsatzes fehlen?
8. Soll das Laufprotokoll künftig Historie führen? Heute ist je Archiv nur der letzte Lauf lesbar, im Stundenarchiv gar keiner - ein ausgefallener Sammellauf ist damit im Nachhinein nicht nachweisbar.
9. Soll die Anzeige in der App korrigiert werden, die heute wörtlich sagt, nicht Geholtes sei "nicht später nachzuholen, sondern fort"? Für die rund 200 Werte mit nächtlichem Rückfüllen ist das nachweislich falsch, und für alle Werte meldet die Karte derzeit "auf Stand", während der laufende Handelstag fehlt.
10. Soll das Testsymbol ZVZZT aus dem Universum genommen werden?

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
