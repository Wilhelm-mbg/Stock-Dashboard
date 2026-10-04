# Mutationstest Momentum-Buch, Gruppe C (04.10.2026)

Datei der Mutanten: `mfhandel.js`, Stand 61dca2c. Funktionen: bucheMassnahmen, stempleKursT, balkenNach, rohBis, schluesseAm, ohneLaufendenBalken, indexVor, stichtagPruefen, punktTag, bargeldAm, reihenendeAusbuchen, nyTeile, tagPlus, istWerktag, werktagVor, nyZeit, letzterFertigerWerktag, bestandFrisch, bewerteDrift (nur Randprobe).

Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

## Ergebnis

- Mutanten: **98** (Liste `C-mutanten.json`, Ergebnisse `C-ergebnis-1..5.json`)
- Von den vorhandenen Tests getoetet: **65**
- Ueberlebt: **33** - davon aequivalent: **4**, echte Luecke: **29** (HOCH 8, MITTEL 10, NIEDRIG 11)
- Neue Kleinsttests `teil-C.test.js` (91 Pruefungen, laufen auf dem Original gruen, unter 1 s): toeten alle 29 echten Luecken (`C-ergebnis-neu.json`: 29 von 33 ueberlebenden getoetet, die uebrigen 4 sind die aequivalenten).

Die schwersten Luecken: doppelt gebuchte Ausschuettungen und Splits (C-07, C-08: nie wurde ein zweiter Takt mit denselben Ereignissen geprueft), die Zaehlung der Handelstage fuer die Faelligkeit (C-28, C-29), der Schnitt der Rangfolge am Ausfuehrungstag (C-30), der Stichtag (C-51, C-52) und die Werktagslogik am Wochenende (C-80).

## Tabelle

| Kennung | Funktion | Aenderung | Urteil | Schwere | Begruendung (Ueberlebende) / Test-Hinweis | Neuer Test |
|---|---|---|---|---|---|---|
| C-01 | bucheMassnahmen | Ex-Tag-Grenze: Beginn eingeschlossen (>= statt >) | getoetet | - | test-v6: 7 neu rot, z.B. ❌    Gegenprobe: "t >= Beginn" statt ">" fael |  |
| C-02 | bucheMassnahmen | Ex-Tag-Grenze: letzter Balken ausgeschlossen (< statt <=) | getoetet | - | test-v6: 26 neu rot, z.B. ❌    Gegenprobe: "t >= Beginn" statt ">" fae |  |
| C-03 | bucheMassnahmen | Split-Faktor Stueck n/z statt z/n | getoetet | - | test-v6: 19 neu rot, z.B. ❌    Gegenprobe: "t >= Beginn" statt ">" fae |  |
| C-04 | bucheMassnahmen | Split-Faktor Einstand z/n statt n/z | getoetet | - | test-v6: 13 neu rot, z.B. ❌    Gegenprobe: "t >= Beginn" statt ">" fae |  |
| C-05 | bucheMassnahmen | Leerverkauf-Vorzeichen der Ausschuettung entfernt | getoetet | - | test-v6: 6 neu rot, z.B. ❌    Gegenprobe: Ausschuettung mit der Stueck |  |
| C-06 | bucheMassnahmen | Richtung vertauscht: Kauf belastet, Leerverkauf gutgeschrieben | getoetet | - | test-v6: 8 neu rot, z.B. ❌    Gegenprobe: Ausschuettung mit der Stueck |  |
| C-07 | bucheMassnahmen | Ausschuettung wird nicht als gebucht gemerkt (doppelt buchen) | ueberlebt, echte Luecke | HOCH | Ohne Merker bucht jeder weitere Takt dieselbe Ausschuettung erneut ins Bargeld; die Pruefung "gebucht" (C-20 getoetet) allein faengt das nicht, weil der Merker nie geschrieben wuerde - die Suite buchte nie zweimal mit denselben Daten nach. | ja: C Ausschuettung nur einmal |
| C-08 | bucheMassnahmen | Split wird nicht als gebucht gemerkt (doppelt buchen) | ueberlebt, echte Luecke | HOCH | Ohne Merker wuerde derselbe Split bei jedem Takt erneut Stueck und Einstand umrechnen (Faktor z/n mehrfach). | ja: C Split nur einmal |
| C-09 | bucheMassnahmen | Splitsperre: genau 30 Tage nicht mehr gesperrt | getoetet | - | test-v6: 2 neu rot, z.B. ❌ 96.4 Sperre: genau 30 Tage Abstand ist gesp |  |
| C-10 | bucheMassnahmen | Splitsperre 3 statt 30 Tage | getoetet | - | test-v6: 5 neu rot, z.B. ❌ 84.4 fehlend, neu und nachgewachsen werden  |  |
| C-11 | bucheMassnahmen | Splits nicht zeitlich sortiert | ueberlebt, echte Luecke | MITTEL | Ohne zeitliche Sortierung entscheidet die Reihenfolge der Quelle, welcher von zwei nahen Splits gebucht und welcher gesperrt wird. | ja: C Splits zeitlich sortiert |
| C-12 | bucheMassnahmen | Ausschuettung 0 wird gebucht (>= statt >) | ueberlebt, echte Luecke | NIEDRIG | Eine Ausschuettung 0 erzeugte eine Buchung mit Summe 0 (Journalzeile, Massnahmenliste); Bargeld unveraendert. | ja: C Betrag 0 und Nenner 0 ohne Buchung |
| C-13 | bucheMassnahmen | Split mit Nenner 0 zugelassen | ueberlebt, echte Luecke | MITTEL | Nenner 0 ergaebe Stueck = Unendlich; nur bei fehlerhafter Quelle erreichbar. | ja: C Betrag 0 und Nenner 0 ohne Buchung |
| C-14 | bucheMassnahmen | Beginn immer p.seit statt kursT | getoetet | - | test-v6: 10 neu rot, z.B. ❌    Gegenprobe: "t >= Beginn" statt ">" fae |  |
| C-15 | bucheMassnahmen | Rueckfall ohne kursT: 0 statt seit (Nachbuchung aller Altereignisse) | ueberlebt, echte Luecke | MITTEL | Positionen ohne kursT (aus der Zeit vor Nr. 87) bekaemen alle historischen Ereignisse gutgeschrieben; heute stempelt stempleKursT neue Positionen, Altbestand bleibt betroffen. | ja: C Beginn ohne kursT = seit |
| C-16 | bucheMassnahmen | Massnahmen-Kappe 399 statt 400 | ueberlebt, echte Luecke | NIEDRIG | Die Massnahmenliste verlor eine Buchung zu frueh; bargeldAm rechnet nur mit der Liste. Erst ab 400 Buchungen erreichbar. | ja: C massnahmen auf 400 gekappt |
| C-17 | bucheMassnahmen | Sperrmeldung neu-Kennzeichen invertiert | getoetet | - | test-v6: 3 neu rot, z.B. ❌ 96.4 Journal: ein gesperrter Split wird ein |  |
| C-18 | bucheMassnahmen | gesperrter Split wird nicht als gemeldet gemerkt | getoetet | - | test-v6: 3 neu rot, z.B. ❌ 96.4 Journal: ein gesperrter Split wird ein |  |
| C-19 | bucheMassnahmen | Splitsperre ohne Betrag (nur nach vorn) | ueberlebt, echte Luecke | MITTEL | Ohne Betrag sperrt ein schon gebuchter spaeterer Split jeden frueheren Split des Werts, egal wie weit entfernt (nur bei nachtraeglich gelieferten fruehen Ereignissen). | ja: C Sperre mit Betrag des Abstands |
| C-20 | bucheMassnahmen | Gebucht-Pruefung entfernt | getoetet | - | test-v6: 9 neu rot, z.B. ❌    Gegenprobe: ohne den Merker p.gebucht fa |  |
| C-21 | bucheMassnahmen | fehlende barZeit nicht abgefangen | ueberlebt, aequivalent | - | Fehlt barZeit fuer den Wert, ist bis = undefined; "t <= undefined" ist immer falsch, also wird ohnehin nichts gebucht (Beweis: Aufruf mit barZeit nur fuer anderen Wert liefert dieselbe leere Antwort). Der Zweig ist redundant. | - |
| C-22 | stempleKursT | stempelt auch aeltere Positionen (<=) | getoetet | - | test-v6: 2 neu rot, z.B. ❌ 96.4 stempleKursT: nur neue Positionen (sei |  |
| C-23 | stempleKursT | ueberschreibt vorhandenes kursT | getoetet | - | test-v6: 2 neu rot, z.B. ❌ 96.4 stempleKursT: nur neue Positionen (sei |  |
| C-24 | stempleKursT | Zaehler n nicht erhoeht | getoetet | - | test-v6: 2 neu rot, z.B. ❌ 96.4 stempleKursT: nur neue Positionen (sei |  |
| C-25 | stempleKursT | kursT = Kaufzeit statt Balkenzeit | getoetet | - | test-v6: 4 neu rot, z.B. ❌ 96.4 nach einer Umschichtung: A (gekauft zu |  |
| C-26 | balkenNach | balkenNach zaehlt den Tag selbst mit | getoetet | - | test-v6: 4 neu rot, z.B. ❌ 100.7 C3: die Karte nennt den Tag der naech |  |
| C-27 | balkenNach | balkenNach ohne Untergrenze 0 | getoetet | - | test-v6: 1 neu rot, z.B. ❌ 98.5 am Ausfuehrungstag selbst, ab ihm geza |  |
| C-28 | balkenNach | bisTag eingeschlossen | ueberlebt, echte Luecke | HOCH | faelligkeit zaehlt mit balkenNach(.., heute) die Balken zwischen letzter Ausfuehrung und heute; mit eingeschlossenem heutigem Tag waere die Umschichtung einen Handelstag zu frueh faellig. | ja: C balkenNach mit bisTag |
| C-29 | balkenNach | balkenNach beginnt einen Tag spaeter | ueberlebt, echte Luecke | HOCH | Beginnt die Zaehlung einen Tag spaeter, ist jede Umschichtung (63 Handelstage) und jedes Reihenende einen Handelstag zu frueh bzw. zu spaet - hier: ein Balken weniger gezaehlt. | ja: C balkenNach ohne bisTag |
| C-30 | rohBis | rohBis schneidet den Tag selbst weg | ueberlebt, echte Luecke | HOCH | rohBis schnitte den Balken des Ausfuehrungstags selbst weg: die Rangfolge der Umschichtung rechnete mit den Kursen des Vortags. | ja: C rohBis schneidet bis einschliesslich Tag |
| C-31 | rohBis | rohBis schneidet einen Balken zu viel | getoetet | - | test-v6: 1 neu rot, z.B. ❌ Zeichenzeit fuer 390 Kerzen bleibt weit unt |  |
| C-32 | rohBis | rohBis nimmt einen Tag zu viel | getoetet | - | test-v6: 1 neu rot, z.B. ❌ 98.5 um 09:36: Rangfolge auf den Schluessen |  |
| C-33 | schluesseAm | Schluesse des Tages: Grenze Tagesbeginn | getoetet | - | test-v6: 1 neu rot, z.B. ❌ 98.7 der Tagespunkt gehoert zu X = Montag: ; Kleinsttest-Urteil geaendert: 1:ZEIGT ABWEICHUNG |  |
| C-34 | schluesseAm | Schluss 0 wird zugelassen | ueberlebt, echte Luecke | MITTEL | Ein Schluss von 0 ginge als Preis in Rangfolge/Bewertung ein; erreichbar nur bei fehlerhaften Quelldaten. | ja: C schluesseAm Schluss 0 ausgeschlossen |
| C-35 | schluesseAm | Balkenstempel verschoben | ueberlebt, echte Luecke | NIEDRIG | Der Stempel wird um 1 ms verschoben; wegen t > kursT praktisch folgenlos (Ereignisstempel liegen auf dem Balken, nicht 1 ms daneben). Der neue Test prueft den Stempel exakt. | ja: C schluesseAm Schluss und Stempel |
| C-36 | schluesseAm | Index um eins daneben | getoetet | - | test-v6: 1 neu rot, z.B. ❌ 98.7 der Tagespunkt gehoert zu X = Montag: ; Kleinsttest-Urteil geaendert: 1:ZEIGT ABWEICHUNG |  |
| C-37 | ohneLaufendenBalken | laufender Balken: genau 16:15 noch laufend | ueberlebt, echte Luecke | NIEDRIG | Nur genau um 16:15:00,000 New York wuerde der laufende Balken noch abgeschnitten statt behalten; Randfall von einer Millisekunde. | ja: C 16:15 genau: Reihe unveraendert |
| C-38 | ohneLaufendenBalken | Balken exakt 00:00 NY nicht geschnitten | ueberlebt, echte Luecke | NIEDRIG | Nur ein Balken mit Stempel exakt 00:00 New York heute bliebe stehen; Quellenstempel liegen bei 09:30. | ja: C Balken 00:00 heute geschnitten |
| C-39 | ohneLaufendenBalken | Schnittgrenze 09:30 statt Tagesbeginn | getoetet | - | Kleinsttest-Urteil geaendert: 6:ZEIGT ABWEICHUNG |  |
| C-40 | ohneLaufendenBalken | Schnittgrenze gestern | getoetet | - | test-v6: 1 neu rot, z.B. ❌ 98.7 Grenze 16:15 New York: um 16:14 ist de |  |
| C-41 | ohneLaufendenBalken | Schnitt einen Balken zu spaet | getoetet | - | test-v6: 1 neu rot, z.B. ❌ 98.7 Grenze 16:15 New York: um 16:14 ist de; Kleinsttest-Urteil geaendert: 6:ZEIGT ABWEICHUNG |  |
| C-42 | indexVor | indexVor: <= statt < | ueberlebt, echte Luecke | NIEDRIG | Nur ein Balken exakt auf der Grenze (00:00 New York) wuerde dem Vortag zugeschlagen; Quellenstempel liegen bei 09:30. | ja: C indexVor streng kleiner als die Grenze |
| C-43 | indexVor | indexVor: Schleife endet zu frueh | getoetet | - | test-v6: 5 neu rot, z.B. ❌ 100.7 C3: die Karte nennt den Tag der naech; Kleinsttest-Urteil geaendert: 1:ZEIGT ABWEICHUNG |  |
| C-44 | indexVor | indexVor: Treffer um eins daneben | getoetet | - | test-v6: 3 neu rot, z.B. ❌ 98.4 Grenze fuenf Handelstage: 4 ohne neuen; Kleinsttest-Urteil geaendert: 1:ZEIGT ABWEICHUNG,2:ZEIGT ABWEICHUNG,6: |  |
| C-45 | stichtagPruefen | 95 %-Schwelle strikt | getoetet | - | test-v6: 1 neu rot, z.B. ❌ 98.5 Frische gegen die Uhr: ein Bestand von |  |
| C-46 | stichtagPruefen | Schwelle 90 statt 95 | getoetet | - | test-v6: 1 neu rot, z.B. ❌ 98.5 Frische gegen die Uhr: ein Bestand von |  |
| C-47 | stichtagPruefen | Stichtag-Balken > von | ueberlebt, echte Luecke | NIEDRIG | Nur ein Balken exakt um 00:00 New York des Stichtags wuerde nicht mitgezaehlt. | ja: C Balken genau 00:00 des Stichtags zaehlt |
| C-48 | stichtagPruefen | geladenNach gegen heute statt Vorwerktag | getoetet | - | Kleinsttest-Urteil geaendert: 2:ZEIGT ABWEICHUNG,6:ZEIGT ABWEICHUNG |  |
| C-49 | stichtagPruefen | geladenNach strikt | getoetet | - | test-v6: 1 neu rot, z.B. ❌ 84.4 fehlend, neu und nachgewachsen werden  |  |
| C-50 | stichtagPruefen | leere Bestandsmenge zaehlt als ok | ueberlebt, echte Luecke | MITTEL | Ohne Werte (leerer Bestand) waere der Stichtag "ok"; der Aufrufer faengt leere Bestaende wohl anderswo ab, die Funktion selbst nicht mehr. | ja: C leere Wertemenge nie ok |
| C-51 | stichtagPruefen | Stichtag = heute statt letzter Tag vor heute | ueberlebt, echte Luecke | HOCH | Stichtag = heute statt juengster Tag vor heute: die Umschichtung rechnete mit dem laufenden Tag statt mit dem abgeschlossenen Stichtag. | ja: C Stichtag = letzter Tag vor heute |
| C-52 | stichtagPruefen | Stichtag-Fenster einen Tag zu weit | ueberlebt, echte Luecke | HOCH | Mit zu weitem Fenster zaehlten Balken des Vortags als Balken vom Stichtag: veraltete Bestaende gaelten als vollstaendig. | ja: C 18 von 20 = 90 % reicht nicht |
| C-53 | punktTag | Verlaufspunkt: heute zaehlt immer | getoetet | - | test-v6: 1 neu rot, z.B. ❌ 98.7 Grenze 16:15 New York: um 16:14 ist de |  |
| C-54 | punktTag | Verlaufspunkt: 16:15 genau noch nicht fertig | ueberlebt, echte Luecke | NIEDRIG | Nur genau um 16:15:00,000 New York gaelte der heutige Balken noch nicht als abgeschlossen. | ja: C punktTag ab 16:15 genau: heute |
| C-55 | punktTag | Verlaufspunkt: Kurs = Zeitstempel | getoetet | - | test-v6: 1 neu rot, z.B. ❌ 98.7 der Tagespunkt gehoert zu X = Montag:  |  |
| C-56 | punktTag | Verlaufspunkt: Kurs 0 zugelassen | ueberlebt, echte Luecke | MITTEL | Ein Schluss 0 wuerde Verlaufspunkt-Kurs 0 liefern (Verlaufswert des Buchs falsch); nur bei fehlerhaften Daten. | ja: C punktTag Schluss 0: null |
| C-57 | punktTag | Verlaufspunkt: heute in UTC | ueberlebt, aequivalent | - | heute in UTC statt New York: Weicht nur abends New York ab (UTC-Datum = NY-Datum + 1). Dann sind alle Balken (nie in der Zukunft) vor diesem "heute", und die fertig-Pruefung wird nur fuer Balken mit tag === heute gebraucht, die es nicht gibt. Gleiches Ergebnis fuer jede erreichbare Reihe. | - |
| C-58 | bargeldAm | bargeldAm: Ex-Tag gleich tX wird abgezogen | ueberlebt, echte Luecke | MITTEL | Ex-Tag gleich tX wuerde faelschlich aus dem Bargeld des Verlaufspunkts herausgerechnet; nur Anzeige/Verlauf (Bargeld des Verlaufspunkts). | ja: C bargeldAm: nur spaetere Ausschuettungen abziehen |
| C-59 | bargeldAm | bargeldAm: Vorzeichen | getoetet | - | test-v6: 1 neu rot, z.B. ❌ 98.7 der Tagespunkt gehoert zu X = Montag:  |  |
| C-60 | bargeldAm | bargeldAm: falsche Art | getoetet | - | test-v6: 1 neu rot, z.B. ❌ 98.7 der Tagespunkt gehoert zu X = Montag:  |  |
| C-61 | bargeldAm | bargeldAm: isFinite entfernt | getoetet | - | test-v6: 1 neu rot, z.B. ❌ 84.4 fehlend, neu und nachgewachsen werden  |  |
| C-62 | reihenendeAusbuchen | Reihenende nach 4 statt 5 Handelstagen | getoetet | - | test-v6: 2 neu rot, z.B. ❌ 98.4 Grenze fuenf Handelstage: 4 ohne neuen |  |
| C-63 | reihenendeAusbuchen | Reihenende strikt | getoetet | - | test-v6: Exit 1 |  |
| C-64 | reihenendeAusbuchen | Leerverkauf Gutschrift ohne Faktor 2 | getoetet | - | test-v6: 2 neu rot, z.B. ❌ 100.5 Reihenende: beim Leerverkauf die Rech |  |
| C-65 | reihenendeAusbuchen | Leerverkauf Gutschrift kann negativ werden | getoetet | - | test-v6: 1 neu rot, z.B. ❌ 100.5 Reihenende: beim Leerverkauf die Rech |  |
| C-66 | reihenendeAusbuchen | Reihenende mit Verkaufskosten 10 Bp | getoetet | - | test-v6: 2 neu rot, z.B. ❌ 100.5 Reihenende: beim Leerverkauf die Rech; Kleinsttest-Urteil geaendert: 3:ZEIGT ABWEICHUNG |  |
| C-67 | reihenendeAusbuchen | Position nicht entfernt | getoetet | - | test-v6: 2 neu rot, z.B. ❌ 98.4 Grenze fuenf Handelstage: 4 ohne neuen; Kleinsttest-Urteil geaendert: 3:ZEIGT ABWEICHUNG |  |
| C-68 | reihenendeAusbuchen | Kurz/Lang vertauscht | getoetet | - | test-v6: 3 neu rot, z.B. ❌ 100.5 Reihenende: beim Leerverkauf die Rech |  |
| C-69 | reihenendeAusbuchen | Zaehlung um eins hoeher | getoetet | - | test-v6: 2 neu rot, z.B. ❌ 98.4 Grenze fuenf Handelstage: 4 ohne neuen |  |
| C-70 | reihenendeAusbuchen | Bargeld auf Cent gerundet | ueberlebt, echte Luecke | NIEDRIG | Das Bargeld wuerde bei Reihenende auf Cent gerundet (Abweichung unter 0,5 Cent je Ausbuchung gegen die Messung). | ja: C Reihenende nach 5 Balken, Lang |
| C-71 | reihenendeAusbuchen | Reihenende pnl gegen Kurs statt Einstand | ueberlebt, echte Luecke | MITTEL | Der Gewinn/Verlust der Ausbuchung (trades.pnl, im Journal sichtbar) waere falsch (gegen Kurs statt Einstand = immer 0 bei Kauf); Bargeld unberuehrt. | ja: C Reihenende nach 5 Balken, Lang / C Reihenende pnl auf Cent gerundet |
| C-72 | reihenendeAusbuchen | Reihenende-Tag in UTC | ueberlebt, echte Luecke | NIEDRIG | Nur bei einem Balkenstempel abends New York (ueber UTC-Mitternacht) zaehlte der letzte Handelstag einen Tag zu spaet; Quellenstempel liegen bei 09:30. | ja: C Reihenende Tag in New York, nicht UTC |
| C-73 | reihenendeAusbuchen | Reihenende: Schluss 0 wird ausgebucht | ueberlebt, echte Luecke | MITTEL | Eine Reihe mit letztem Schluss 0 wuerde zu 0 ausgebucht (Wertvernichtung statt Position behalten); nur bei fehlerhaften Daten. | ja: C Reihenende Schluss 0: bleibt |
| C-74 | reihenendeAusbuchen | Reihenende: trades-Kappe fehlt | ueberlebt, echte Luecke | NIEDRIG | Die trades-Liste wuchse ueber 400 Eintraege; nur Speichergroesse. | ja: C Reihenende trades auf 400 gekappt |
| C-75 | nyTeile | Zeitzone UTC statt New York | getoetet | - | test-v6: 3 neu rot, z.B. ❌    Gegenprobe: Faelligkeit ueber die Uhrzei; Kleinsttest-Urteil geaendert: 6:ZEIGT ABWEICHUNG |  |
| C-76 | nyTeile | 24-Uhr-Normierung entfernt | ueberlebt, aequivalent | - | Mit hourCycle h23 liefert Intl in Node 22 fuer Mitternacht "00", nie "24" (Aufruf geprueft), "% 24" greift nie. | - |
| C-77 | nyTeile | Tag/Monat vertauscht | getoetet | - | test-v6: 1 neu rot, z.B. ❌ nach 90 Tagen fällig; Kleinsttest-Urteil geaendert: 1:ZEIGT ABWEICHUNG,2:ZEIGT ABWEICHUNG,3: |  |
| C-78 | tagPlus | tagPlus + 1 Stunde (Sommerzeit-Drift im UTC-Rechnen unkritisch) | ueberlebt, aequivalent | - | tagPlus rechnet von UTC-Mitternacht und liest nur das Datum; +1 Stunde aendert das Datum nie (Aufruf ueber +-400 Tage: 0 Abweichungen). | - |
| C-79 | tagPlus | tagPlus negativ um eins zu kurz | getoetet | - | Kleinsttest-Urteil geaendert: 2:ZEIGT ABWEICHUNG,6:ZEIGT ABWEICHUNG |  |
| C-80 | istWerktag | Samstag gilt als Werktag | ueberlebt, echte Luecke | HOCH | Ein Samstag gaelte als Werktag: letzterFertigerWerktag, werktagVor und der Rueckstand der Marktreihe wuerden am Wochenende falsche Tage nennen (veraltet/frisch, Stichtag). | ja: C istWerktag Fr/Sa/So/Mo |
| C-81 | istWerktag | Sonntag gilt als Werktag | getoetet | - | test-v6: Exit 1 |  |
| C-82 | werktagVor | werktagVor ueberspringt Wochenende nicht | getoetet | - | test-v6: Exit 1 |  |
| C-83 | nyZeit | nyZeit Startschaetzung 4 h | getoetet | - | test-v6: Exit 1 |  |
| C-84 | nyZeit | nyZeit: nur ein Korrekturschritt | getoetet | - | test-v6: Exit 1 |  |
| C-85 | nyZeit | nyZeit Korrekturvorzeichen | getoetet | - | test-v6: 3 neu rot, z.B. ❌    Gegenprobe: Faelligkeit ueber die Uhrzei |  |
| C-86 | nyZeit | Schluss fertig 16:00 statt 16:15 | getoetet | - | test-v6: 2 neu rot, z.B. ❌ 98.5 Frische gegen die Uhr: ein Bestand von |  |
| C-87 | nyZeit | Handel ab 09:30 statt 09:35 | getoetet | - | test-v6: 1 neu rot, z.B. ❌ 98.5 Grenze 09:35 New York: um 09:34 kein H |  |
| C-88 | nyZeit | Handel ab 09:45 | getoetet | - | test-v6: Exit 1 |  |
| C-89 | nyZeit | Schluss fertig 15:15 | getoetet | - | test-v6: 2 neu rot, z.B. ❌ 98.5 Frische gegen die Uhr: ein Bestand von |  |
| C-90 | letzterFertigerWerktag | genau 16:15 noch nicht fertig | getoetet | - | test-v6: Exit 1 |  |
| C-91 | letzterFertigerWerktag | Wochenende wird als fertiger Tag gewertet | getoetet | - | test-v6: Exit 1 |  |
| C-92 | letzterFertigerWerktag | vor Schluss: heute statt Vorwerktag | getoetet | - | test-v6: 1 neu rot, z.B. ❌ 98.6 Grenze drei Tage: Marktreihe drei Werk |  |
| C-93 | bestandFrisch | Ladezeit 0 gilt als moeglich frisch | getoetet | - | test-v6: Exit 1 |  |
| C-94 | bestandFrisch | Frische strikt | getoetet | - | test-v6: Exit 1 |  |
| C-95 | bestandFrisch | Frische ab 16:00 statt 16:15 | getoetet | - | test-v6: Exit 1 |  |
| C-96 | bestandFrisch | Frische gegen heute statt letzten fertigen Werktag | getoetet | - | test-v6: Exit 1 |  |
| C-97 | bewerteDrift | bewerteDrift: Rundung entfernt (beruehrt Momentum nur ueber Verlaufspunkt) | getoetet | - | test-v6: Exit 1 |  |
| C-98 | bewerteDrift | bewerteDrift: Short-Wert ohne Untergrenze | getoetet | - | test-v6: Exit 1 |  |

## Anmerkungen (kein Mutant, nur berichtet)

1. `driftAbgleich` wurde nicht mutiert: es betrifft nur das Drift-Buch, nicht das Momentum-Buch. `bewerteDrift` hat zwei Randproben (C-97, C-98), beide von bestehenden Tests getoetet.
2. `bucheMassnahmen` und `bargeldAm` haengen an `buch.massnahmen` (Kappe 400): Faellt eine Ausschuettung aus der Liste, rechnet `bargeldAm` im Verlaufspunkt zu viel Bargeld (C-16). Ab 400 Buchungen im Buch ist die Nachrechenbarkeit des Bargelds also nicht mehr vollstaendig.
3. `punktTag` gibt `null` zurueck, wenn der juengste abgeschlossene Balken den Schluss 0 hat, statt auf den davor zurueckzugreifen; `schluesseAm` laesst den Wert in dem Fall aus. Verhalten uneinheitlich, aber bewusst vorsichtig.
4. `nyZeit` fuer eine nicht existierende Ortszeit (02:30 am 08.03.2026) pendelt in der Korrekturschleife; die Aufrufer fragen nur 00:00, 09:30-09:35 und 16:15 ab, deshalb ohne Folge. Die Mutanten "Start 4 h" (C-83) und "nur ein Korrekturschritt" (C-84) wurden von bestehenden Tests getoetet.
5. `massnahmenJournal` nennt den Ex-Tag als UTC-Kalendertag des Zeitstempels (im Code so begruendet: Yahoo stempelt Ex-Tag-Balken am Handelstag, UTC-Datum = NY-Datum bei Stempeln um 13:30/14:30 UTC). Bei einem Stempel nach 19:00/20:00 New York waere das Datum ein Tag zu spaet; kein Mutant, nicht untersucht.
6. Das Harness lief mit 5 parallelen Laeufen (je ~20 Mutanten); Kopie des Baums entsteht beim Start, deshalb floss `teil-C.test.js` nicht in die Hauptlaeufe ein.
