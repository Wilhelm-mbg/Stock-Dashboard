# Funde mfhandel.js (Diff 450daed..HEAD) - Generalprobe 23.11.2026

Gelesen: CLAUDE.md, REGEL.md (Teil A 1.2-1.5, Teil C), rueckblick.js (Schritte 1-6), den ganzen Diff `450daed..HEAD -- mfhandel.js` und den Takt in mfdepot.js
(`takt`, `massnahmenBuchen`, `reihenendeBuchen`, `tagespunkt`, `eroeffnung`, `ausfuehrungVorbereiten`, `offenNachfassen`) sowie `mittelfrist.js:holeTage`
(nur um zu wissen, was im Bestand steht). Jeder Fund hat ein Modul in `funde/<kennung>.js`; `lauf()` liefert `abweichung: true`, solange der Fehler im Code steckt.
App-Code unveraendert, nichts committet.

## Funde

### M-01 (Klasse A) - Ausschuettung geht verloren, wenn die Position am Ex-Tag = Ausfuehrungstag verkauft wird
- Ort: `mfhandel.js:607` bucheMassnahmen (iteriert nur ueber `buch.positionen`); Aufruf `mfdepot.js:384` steht VOR `ausfuehrungVorbereiten` (`mfdepot.js:418`).
- Ausloeser: Ex-Tag einer gehaltenen Aktie ist der Ausfuehrungstag (Mo 23.11.), die Aktie ist nicht im neuen Ziel (oder wird nach Regel K2 aufgeloest).
- Ursache: `mittelfrist.js:81` schneidet den laufenden Balken (vor 16:15 New York) aus dem Bestand; um 09:35 endet `barZeit` am Freitag, `t <= barZeit` ist falsch, es wird
  nichts gebucht. Die Umschichtung verkauft die Position. Nach 16:15 steht der Balken des Ex-Tags im Bestand, aber die Position ist nicht mehr im Buch - die Ausschuettung
  wird nie gebucht (es gibt keinen Merker fuer Ansprueche verkaufter Positionen).
- Beobachtet (Kunstdaten, 100 Stueck, 1,50 $ je Stueck): Takt 09:35 bucht 0, Takt nach 16:15 bucht 0; 150,00 $ fehlen. Erwartet: 1 Buchung ueber 150,00 $ - REGEL C.3 "ein Verkauf
  zur Eroeffnung des Ex-Tags zaehlt noch", rueckblick.js Schritt 2 (Ausschuettungen) VOR Schritt 3 (Umschichtung), Gutschrift danach.
- Groesse: Quartalsausschuettung etwa 0,3-1,0 % des Positionswerts je betroffene Position; wahrscheinlich nur 0-2 Positionen am 23.11. (Ex-Tag auf dem Ausfuehrungstag
  trifft rund 1/63 der Zahler). Klein, aber ein sicherer Live-gegen-Messung-Unterschied.
- Behaltene Position mit Ex-Tag am Ausfuehrungstag: korrekt (wird nach 16:15 gebucht, wie die Messung) - siehe `OK-03`.

### M-02 (Klasse A) - Split mit Ex-Tag = Ausfuehrungstag: Plan rechnet Eroeffnung nach dem Split gegen die ungesplittete Stueckzahl
- Ort: `mfhandel.js:118` planeUmschichtung / `:159` fuehreAus; Preisquelle `mfdepot.js:263` eroeffnung (`bereinigt:false`, also roher Kurs nach dem Split).
- Ausloeser: eine gehaltene Aktie hat am 23.11. Ex-Tag eines Splits. Der Split steht erst nach 16:15 im Bestand und wird erst dann gebucht (`t <= barZeit`).
- Beobachtet (4:1, 100 Stueck zu 100 $ vorher, Eroeffnung 25 $, nicht im Ziel): Verkauf bringt 2.495,00 $; im Ziel liegt der Plan-Depotwert bei 12.500 $ statt 20.000 $
  (Budget je Platz zu klein, bei sehr hohem Faktor gilt der Bestand sogar als Kleinstbestand und wird aufgeloest und neu gekauft). Erwartet: 9.980,00 $ Erloes bzw. 20.000 $ Depotwert.
  Umgekehrter Split (z. B. 1:10) ueberzeichnet den Depotwert entsprechend und das Budget aller Kaeufe wird zu gross.
- In der Messung (Panel mit bereinigten Kursen) gibt es das nicht: Stueck x bereinigter Kurs ist ueber den Split konstant. Die Sperrung "Split nicht vor dem Ausfuehrungstag buchbar" ist
  die Luecke; eine Loesung muesste Ereignisse mit Ex-Tag = heute schon vor dem Plan auf die Stueckzahl anwenden (Ereignisliste kennt sie, der Bestand nicht).
- Wahrscheinlichkeit am 23.11. gering (Split-Ex-Tag auf einer der ~20 gehaltenen Aktien), Schaden im Fall gross.

### M-03 (Klasse B) - Reihenende nach 5 Handelstagen: Wert der endenden Position wird bei einer Umschichtung davor nicht angelegt
- Ort: `mfhandel.js:426-427` REIHENENDE_TAGE = 5 / reihenendeAusbuchen, zusammen mit `:118` planeUmschichtung (Position ohne Kurs: `halten`, nicht im Depotwert).
- Ausloeser: die Reihe einer gehaltenen Aktie endet in den 5 Handelstagen vor der Umschichtung (Uebernahme, Delisting - z. B. letzter Handelstag Fr 20.11.).
- Die Quelle nennt die Abweichung "bewusst; der Preis ist derselbe". Der Preis ja, die Folge nicht: rueckblick.js Schritt 1 bucht am ersten Tag ohne Zeile VOR der Umschichtung und legt
  das Geld mit an. Live steht die Position am Montag ohne Kurs als "gehalten" im Buch, ihr Wert fehlt im Depotwert (Budget zu klein), das Geld liegt nach der Ausbuchung (5 Tage spaeter) bis zur
  naechsten Umschichtung (63 Handelstage) als Bargeld.
- Beobachtet (Kunstdaten, 2 Positionen je 20.000 $, eine davon endet am 20.11.): ausgebucht 0, Plan-Depotwert 20.000 $, Neukauf 0 Stueck; erwartet (Messung): Depotwert 40.000 $, Neukauf 399,2 Stueck.
- Nur ein Randfall, aber echt. Unabhaengig davon: faellt der Umschichtungstag mit dem ERSTEN Tag ohne Zeile zusammen, handelt die Messung anders als die App.

### M-04 (Klasse C) - nachfassen rundet die Stueckzahl ab, Plan/Messung runden
- `mfhandel.js:777` nachfassen (`Math.floor`) gegen `:118` planeUmschichtung (`Math.round`): 1.666,6666 gegen 1.666,6667 Stueck bei 10.000 $ / 6 $. Cent-Groessenordnung je spaetem Kauf.

### M-05 (Klasse C) - Journal zaehlt jeden kleinen Bestand als "Kleinstbestand aufgeloest"
- `mfhandel.js:118` planeUmschichtung: `kleinst.push` steht vor der Zielpruefung, `plan.kleinst` enthaelt auch Bestaende, die ohnehin verkauft wuerden (nicht im Ziel). Die Zeile in `mfdepot.js` ("n Kleinstbestaende aufgeloest") zaehlt sie mit. Nur Text.

## Geprueft, kein Fund (verdaechtigt und entlastet)

- **nyZeit / nyTeile / nyTag** (Sommer-/Winterzeit, 'h23', Stunde 24, Mitternacht): 5.840 Pruefpunkte ueber 2026-2027, einzige Abweichung die nicht existierende Ortszeit 02:30 am Tag des Vorstellens. Stempel 13:30 und 14:30 UTC ergeben beide den richtigen New-Yorker Tag. `OK-02`.
- **Faelligkeit 23.11.**: letzter Ausfuehrungstag 25.08., SPY-Kalender ohne Labor Day/Thanksgiving: 62 Balken dazwischen, Montag 23.11. ist der 63. Handelstag - faellig am 23.11., nicht am Freitag 20.11., auch nach 16:15 ohne Montagsbalken. Entspricht `Q.ptage[o + halten]`. Kein off-by-one. 23.11.2026 ist kein Boersenfeiertag (Thanksgiving ist der 26.11.). `OK-01`. `rebalanceFaellig` (alte Fassung) liefert dort false, weil sie den heutigen Balken mitzaehlt - nur ein Hinweis, der Takt benutzt `faelligkeit`.
- **veraltet n > 3**, `letzterFertigerWerktag`, `bestandFrisch`, `stichtagPruefen`: ohne Feiertagskalender kann an einem Tag nach einem Feiertag ein unnoetiges Nachladen entstehen (Werktag davor ist der Feiertag); fail-safe, kein Fehlhandel.
- **bucheMassnahmen**: Ex-Tag = Kauftag (kursT-Stempel) wird nicht gebucht; Ex-Tag nach Kauf wird gebucht; Split + Ausschuettung in einem Takt (Stueckzahl nach dem Split, Reihenfolge Splits zuerst); Leerverkauf belastet (Vorzeichen, Einstand/Stueck bei Split); zweiter Aufruf bucht nichts (Kennungen); Sperre 30 Tage; umgekehrter Split. `OK-03`. Einzige Luecken: M-01, M-02.
- **bargeldAm**: Ex-Tag nach X wird aus dem Bargeld des Punkts genommen; die Kappung auf 400 verliert nur alte Eintraege. In Ordnung.
- **reihenendeAusbuchen**: splice in absteigender Schleife richtig, Leerverkauf (Gutschrift = Stueck x (2 x Einstand - Kurs)), Position ohne Reihe bleibt, Position unter 5 Tagen bleibt. In Ordnung (ausser M-03).
- **K2/K1**: Kleinstbestand wird zuerst verkauft, dann neu gekauft (Verkaeufe vor Kaeufen, Bargeld reicht); Zufallslauf mit 3.000 Buechern: nie Doppelposition, nie Stueck <= 0, nie negatives Bargeld. `OK-04`.
- **nachfassen**: Kauf eines schon gehaltenen Werts entfaellt (kein zweiter Kauf), Verkauf eines nicht mehr gehaltenen Werts entfaellt; `offen` ist reines JSON und uebersteht einen Neustart; `offenBeenden` loescht nach 16:00 oder am Folgetag. `OK-04`.
- **Rundung** (bewerte auf Cent, `budget * kleinstAnteil` mit Gleitkomma): kein beobachtbarer Einfluss.
- **rohBis / schluesseAm / punktTag / ohneLaufendenBalken**: Grenzen ueber Zeitgrenzen, kein Fehler gefunden.

## Offen / Vermutung (nicht nachgewiesen, daher kein Fund)

- **Regel K ist in der Messung nicht an**: `rueckblick.js:198/200` ruft `planeUmschichtung`/`fuehreAus` ohne `kleinstAnteil`; die App seit Nr. 87 mit 0,05. Als Nachrechnung "ohne/mit Regel K" abgenommen (wiki/erledigt.md, Nr. 96) - kein Fehler, aber Live != Messung nach Definition.
- **Gutschrift-Reihenfolge am Ex-Tag**: laeuft der Takt am Ausfuehrungstag erst NACH 16:15 mit frisch geladenem Bestand (Ex-Tag-Balken da), bucht `massnahmenBuchen` die Ausschuettung VOR der Umschichtung (REGEL C.3: danach). Wirkt auf den Platzwert; am 23.11. nur, wenn die App an dem Tag erst abends laeuft. Nicht nachgebaut.
- **Fehlgeschlagener Abruf**: der Lader behaelt die alte Reihe; nach 5 Handelstagen ohne Antwort einer Aktie wuerde `reihenendeAusbuchen` eine lebende Position als "Reihenende" glattstellen. Nur der Quelltext, keine Gegenprobe gegen mittelfrist.js geschrieben.
- Reihe mit Luecke: die Messung (C.5) bucht eine Luecke nicht aus, die App nach 5 Tagen Luecke schon (Live kennt die Zukunft nicht). Konstruktionsbedingt.
