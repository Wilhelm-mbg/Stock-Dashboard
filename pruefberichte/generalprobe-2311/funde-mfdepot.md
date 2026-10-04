# Funde mfdepot.js / kurse.js / mittelfrist.js (Takt-Ablauf, Zustand, Zusammenspiel)

Stand: HEAD 044d560 gegen 450daed (`git diff 450daed HEAD -- mfdepot.js kurse.js`, dazu mittelfrist.js und mfhandel.js, soweit der Takt sie aufruft).
Gepruefte Lage: Mo 23.11.2026 09:36 New York (Winterzeit), Umschichtung faellig (62 Balken seit 25.08., Labor Day eingerechnet),
193 Werte + SPY, 19 Positionen, 20 Bp je Seite. Jeder Fund hat ein Modul `funde/<Kennung>.js` (`node -e "require('./funde/<Kennung>.js').lauf().then(console.log)"`
aus `pruefberichte/generalprobe-2311/`); alle laufen unter 1 s, ohne Netz, auf der Sandbox aus `lib.js`.
Keine App-Datei geaendert, nichts committet. Klasse A = falsches Geld / falsche Positionen am 23.11.; B = falsche Anzeige / falsche Messung; C = Schoenheit.

Hinweis zu `lib.js` (nicht geaendert): sie nutzt `fs`/`path` ohne `require` (siehe `funde/H-lib-require.js` des anderen Agenten). Meine Module setzen
vor `require('../lib.js')` die Globalen `path`/`fs`, damit sie auch gegen die unveraenderte Datei laufen.

## Zusammenfassung

| Kennung | Kl. | Ort | Kern |
|---|---|---|---|
| D-05 | A | mfhandel.js:748 / 777, mfdepot.js:422-428 | Fehlen die Eroeffnungen der Bestaende (oder alles ausser SPY), ist das Budget 0: entweder fallen alle Kaeufe aus (89 % Bargeld) oder das Nachfassen kauft EINEN Wert mit dem ganzen Bargeld (89 % in einer Aktie) |
| D-06 | A | mittelfrist.js:215/249-251 | SPY ist der 194. Abruf; scheitert er, bleibt die Marktreihe einen Tag alt, traegt aber den neuen Stand: Montag nicht faellig, Tagespunkt falsch |
| D-07 | A (bedingt) | mfhandel.js:360-366 | ab 10 dauerhaft toten Reihen (5 % von 193) blockiert stichtagPruefen jede Umschichtung, dauerhaft |
| D-04 | A | mfhandel.js:123-130, 748 | Fehlt EIN zu verkaufender Bestand um 09:36, werden alle Kaeufe 5 % zu klein; 4.990 $ Bargeld bleiben 63 Handelstage liegen |
| D-02 | A (bedingt) | mfdepot.js:384/422 | Split am Ausfuehrungstag: Bestand wird vorsplit-Stueck x nachsplit-Eroeffnung bewertet/verkauft (halber Erloes) |
| D-01 | A (bedingt, klein) | mfdepot.js:384, mfhandel.js:607 | Dividende mit Ex-Tag = Ausfuehrungstag geht fuer zur Eroeffnung verkaufte Position verloren (Messung zaehlt sie) |
| D-03 | B | mfdepot.js:398, 244 | erster Takt am Ausfuehrungstag nach 16:15: Tagespunkt dieses Tages aus dem Buch VOR der Umschichtung |
| D-08 | B | mfdepot.js:278-306, 440-449 | Netzfehler = "keine Eroeffnung": Umschichtung gilt als ausgefuehrt, Quartal verloren |
| D-09 | B | mfdepot.js:346-363 | ohne drift_markt handelt das Momentum-Buch nicht; falsche Meldung |
| D-10 | C | mfdepot.js:341 | Knopf waehrend laufendem Takt: stumm |
| D-11 | C | mfdepot.js:414, 447 | Knopf nach automatischer Umschichtung desselben Tages bucht eine zweite (Journal "0 Orders", korbVerlauf doppelt) |

Gegenproben (klasse `ok`, kein Fehler): D-ok-01 bis D-ok-05 (unten).

---

## D-05 (A) Budget 0: Kaeufe fallen aus oder All-in  `funde/D-05-budget-null-all-in.js`

- **Ort:** `mfhandel.js:127` (planeUmschichtung: Bestand ohne Eroeffnung zaehlt 0 in `wert`), `mfhandel.js:748` (offeneAuftraege: `budget = plan.depotwert / ziel.length`),
  `mfhandel.js:777-800` (nachfassen: `stueck = budget > 0 ? ... : 0`, danach `fuehreAus`: `!(o.stueck > 0)` -> Verkleinerung auf das GANZE Bargeld), `mfdepot.js:422-428`.
- **Ausloeser (a):** Alle gehaltenen Werte bekommen um 09:36 keine Eroeffnung (sie stehen in `ausfuehrungVorbereiten` am Ende der Abrufliste: erst Ziele, dann Bestaende; Drosselung
  trifft das Ende zuerst), die Ziele schon. `plan.depotwert` = Bargeld = 0 -> alle Kaeufe haben `stueck 0` und scheitern; sie stehen NICHT in `offen` (offeneAuftraege nimmt nur Ziele aus
  `fehltKurs`), nur die 17 Verkaeufe. Um 10:06 werden die Verkaeufe nachgefasst, die Kaeufe nie.
  **Ausloeser (b):** nur SPY antwortet (kurzer Netzausfall nach dem SPY-Abruf): `offen.kaeufe[].budget = 0` fuer alle; das Nachfassen setzt `stueck = 0`, `fuehreAus` verkleinert den
  ersten Kauf (Rang 1) auf das ganze Bargeld (K1 greift nicht, `budget > 0` ist Bedingung).
- **Beobachtet:** (a) nach 10:06: 2 Positionen, Bargeld 89,5 % des Buchs. (b) 3 Positionen, groesste 84.661 $ = 89,4 % des Buchs in KO.
- **Erwartet (Messung):** 19 Positionen zu je 5.000 $, Bargeld < 100 $.
- **Anmerkung:** (b) ist die Folge von D-08 plus Nachfassen; schon der einzelne Fall in D-04 hat dieselbe Wurzel (Budget aus Teilbewertung, nie nachgerechnet).
  Behebung (Vorschlag, nicht umgesetzt): Budget beim Nachfassen aus dem aktuellen Buchwert neu bilden (Bargeld + Bestaende zu verfuegbaren Eroeffnungen, fehlende zum letzten Schluss),
  Kaeufe mit `stueck 0` wegen fehlendem Budget in `offen` aufnehmen, ein Auftrag mit `budget <= 0` nie ausfuehren.

## D-06 (A) SPY-Abruf scheitert: alter Bezug unter neuem Stand  `funde/D-06-spy-ausfall-alter-bezug.js`

- **Ort:** `mittelfrist.js:215` (`UNIVERSUM.concat([BEZUG])`: SPY ist der LETZTE von 194 Abrufen), `mittelfrist.js:249` (`if (!bezug && gespeichert && gespeichert.bezug) bezug = gespeichert.bezug`),
  `mittelfrist.js:251` (`tagesdatenSchreiben(..., Date.now(), ..., bezug)` schreibt ihn unter dem neuen `at`), `mittelfrist.js:128` (bezug gilt, wenn `bz.at === idx.at`).
- **Ausloeser:** Freitag-Lauf (16:30): 193 Werte kommen, SPY (Abruf 194, Yahoo drosselt "bei etwa 200 in Folge", kurse.js Kopf) scheitert. Der Bestand gilt als frisch (`at` = Freitag), kein Nachladen.
- **Beobachtet:** SPY-Reihe endet 19.11., `at` gleich; Montag 09:36 zaehlt `faelligkeit` 61 statt 62 Balken -> nicht faellig, keine Umschichtung am 23.11. (erst Di nach dem naechsten Laden, zu Dienstags-
  Eroeffnung); Tagespunkt traegt `tag 2026-11-19` statt 20.11. Kontrolllauf mit SPY: umgeschichtet.
- **Erwartet:** ein SPY-Ausfall darf den Bestand nicht als gleich frisch ausgeben (Bestand unvollstaendig -> `FEHLVERSUCH`-Pfad / SPY zuerst laden / `at` des Bezugs getrennt pruefen).
- **Wirkung:** stichtagPruefen und faelligkeit lesen dieselbe stale SPY; ist die Umschichtung an einem Tag faellig, an dem SPY einen Tag hinterherhinkt, wird sie einen Tag spaeter UND mit dem
  Stichtag des Vortags gerangt (stichtag = juengster SPY-Tag vor heute).

## D-07 (A, bedingt) Tote Reihen zaehlen im Nenner der Stichtag-Pruefung  `funde/D-07-stichtag-nenner-behaltene-reihen.js`

- **Ort:** `mfhandel.js:360-366` (stichtagPruefen: `gesamt++` fuer JEDE Reihe im Bestand; `ok = mit*100 >= gesamt*95`), `mittelfrist.js:243-248` (ein Wert ohne Antwort behaelt seine alte Reihe, fuer immer).
- **Ausloeser:** Ab 10 dauerhaft verschwundenen Werten (193 Reihen: 183 < 183,35) lautet jedes Mal "nur 183 von 193 Werten mit einem Kurs vom Stichtag ... (noetig 95 %)". Nachladen aendert nichts (die toten
  Werte antworten weiter nicht, der frische Bestand wird nicht neu geladen). Laut Kommentar vom 21.08. waren bereits BK, MMC, HES, FI weg (4).
- **Beobachtet:** 9 tote Reihen: umgeschichtet; 10 tote: kein Handel, Nachladen angestossen ohne Wirkung. **Erwartet:** `momentumZiel` laesst tote Reihen ohnehin als veraltet aus; sie gehoeren nicht in den Nenner.
- **Bedingung am 23.11.:** haengt an der Zahl der Eintraege in `mf_tagesdaten_index.weg` (>= 10 -> Handel blockiert). Das laesst sich im echten Bestand mit einer Feldabfrage nachsehen (nicht roh einlesen).

## D-04 (A) Ein Bestand ohne Eroeffnung drueckt das Budget aller Kaeufe  `funde/D-04-budget-ohne-eroeffnung-haltewert.js`

- **Ort:** wie D-05; Hauptfall des Nr.-94-Nachfassens (die Eroeffnung fehlt um 09:36 und kommt spaeter) - aber fuer einen BESTAND, den die Umschichtung verkauft.
- **Ausloeser:** AAPL (nicht im Ziel) ohne Eroeffnung um 09:36, um 10:06 da. `budget = (0 + 18 Bestaende zu je 5.000) / 19` = 4.737; offen traegt nur den Verkauf.
- **Beobachtet:** nach 10:06: 19 Positionen zu 4.737 (5.000/5.000/4.737 ...), Bargeld 4.990 $ (5,3 %), bis zur naechsten Umschichtung. **Erwartet (Messung, alle Eroeffnungen da):** je ca. 5.000 $, Bargeld < 100 $.
- Die Messung (`rueckblick.js`) hat denselben Gedanken fuer eine echte Handelspause, nie fuer einen Abruf, der nur LIVE fehlt; der spaetere Verkaufserloes wird in keinem Fall angelegt.

## D-02 (A, bedingt) Split am Ausfuehrungstag  `funde/D-02-split-exTag-ausfuehrungstag.js`

- **Ort:** `mfdepot.js:384` (massnahmenBuchen bucht nur bis `barZeit` = juengster GESPEICHERTER Balken), `mfdepot.js:422` (Plan zu Eroeffnungskursen des Tages), `mfhandel.js:607` (t <= barZeit).
- **Ausloeser:** gehaltener Wert mit Split 2:1 am 23.11. Der Bestand (Freitag) kennt ihn nicht, die Eroeffnung ist nachsplit, die Stueckzahl vorsplit.
- **Beobachtet:** 100 Stueck zu 50,22 $ verkauft = 5.022 $ statt 10.044 $ (halber Wert, ebenso `depotwert` und damit alle Budgets zu niedrig). **Erwartet (Messung, Panel bereinigt):** Wert unveraendert.
- **Gegenprobe D-ok-03:** Split mit Ex-Tag Freitag wird vor dem Plan gebucht, Verkauf voll. Das Fenster ist nur der Ausfuehrungstag selbst. Behebung: Ereignisse im Eroeffnungsabruf (`events=div,splits`, ein Abruf je Wert) mitnehmen und bis zum Ausfuehrungstag buchen.

## D-01 (A, bedingt, klein) Dividende am Ex-Tag fuer verkaufte Position  `funde/D-01-dividende-exTag-verkauf.js`

- **Ort:** `mfdepot.js:384`, `mfhandel.js:607` (bucht nur Positionen, die im Buch stehen).
- **Ausloeser:** Ausschuettung mit Ex-Tag = Ausfuehrungstag fuer einen Wert, den die Umschichtung zur Eroeffnung verkauft. Montag kennt der Bestand das Ereignis nicht, Dienstag fehlt die Position.
- **Beobachtet:** Gutschrift 0 $ (Bargeld 0 $ -> 0 $). **Erwartet:** REGEL.md Teil C Nr. 3 "ein Verkauf zur Eroeffnung des Ex-Tags zaehlt noch": 50 Stueck x 1,00 $ = 50 $.
- Wirkung klein (Dividende x Stueck je betroffener Position), aber systematisch ein Unterschied Live gegen Messung. Behebung: Anspruch beim Verkauf vormerken oder Ereignis im Eroeffnungsabruf holen (wie D-02).
  (Der Agent fuer mfhandel.js hat denselben Mechanismus rein geprueft: `funde/M-01-...`.)

## D-03 (B) Tagespunkt des Ausfuehrungstags aus dem Buch vor dem Handel  `funde/D-03-tagespunkt-ausfuehrungstag-vor-handel.js`

- **Ort:** `mfdepot.js:398` (tagespunkt vor dem Handel), `mfdepot.js:244` (Sperre nur bei `letzteAusfuehrungTag > x.tag`, hier gleich).
- **Ausloeser:** erster Takt des Ausfuehrungstags laeuft nach 16:15 New York (App erst abends gestartet): `punktTag` liefert x = Montag (abgeschlossen), der Punkt wird mit den ALTEN Positionen geschrieben, danach schichtet der Takt zur Montags-Eroeffnung um.
- **Beobachtet:** Punkt 23.11. = 100.827 $ (altes Buch zu Montags-Schluessen). **Erwartet:** 102.758 $ (neues Buch, Eroeffnung gekauft, Schluesse Montag), Differenz 1.931 $. Der falsche Punkt bleibt im Verlauf (Massstab).
- Der Normalfall (Takt am Vormittag, Montagspunkt am Dienstag) ist richtig (D-ok-05).

## D-08 (B) Netzfehler wie "keine Eroeffnung"  `funde/D-08-netzausfall-quartal-verloren.js`

- **Ort:** `mfdepot.js:278-306` (`eroeffnung()` verschluckt jeden Fehler, SPY klappt, die uebrigen scheitern), `mfdepot.js:440-449`, `mfdepot.js:309-318`.
- **Ausloeser:** SPY antwortet, alles Weitere bis nach 16:00 nicht. Der Takt setzt `letzteAusfuehrungTag`, `liquideSeit` (Beginn des Vorwaertstests) und eine Zeile "0 Verkaeufe, 0 Kaeufe"; `offen` wird um 16:00 geloescht.
- **Beobachtet:** nach 24.11. 19 unveraenderte Positionen, 0 Trades, `letzteAusfuehrungTag 2026-11-23`, `liquideSeit` gesetzt: naechste Umschichtung erst in 62 Handelstagen. **Erwartet:** keine Handlung = nicht ausgefuehrt, neuer Versuch am naechsten Handelstag.
- Entscheid Nr. 94 ("ohne Eroeffnung kein Handel, wie in der Messung") ist fuer fehlende BALKEN gedacht; hier trifft er einen Netzfehler. Vor einer Aenderung Wilhelms Entscheid noetig. Kombination mit D-05 (b) ist der gefaehrliche Fall.

## D-09 (B) drift_markt als Voraussetzung  `funde/D-09-takt-braucht-drift-markt.js`

- **Ort:** `mfdepot.js:346-363` (`if (!daten || !markt) ... return`), `mfdepot.js:61-64`.
- **Beobachtet:** Tagesdaten + SPY im Bestand, `drift_markt` fehlt: kein Handel, Meldung "Keine Tagesdaten - erst oben Daten holen und rechnen". **Erwartet:** Momentum handelt auf `mf_tagesdaten` + `mf_bezug`.
- Am 23.11. nur relevant, wenn der Bestand `drift_markt` fehlt/unlesbar ist (Wilhelms Installation laeuft seit Monaten: unwahrscheinlich).

## D-10 (C) Knopf stumm waehrend Takt  `funde/D-10-knopf-waehrend-takt-stumm.js`

`mfdepot.js:341`: `if (LAEUFT) return;` ohne Statuszeile. Waehrend ein Takt auf die Abrufe wartet (bis zu ca. 40 Abrufe a 90 ms + Netz), tut "jetzt umschichten" nichts. Kein Doppelhandel (siehe unten).

## D-11 (C) Zweite Umschichtung am selben Tag per Knopf  `funde/D-11-knopf-zweite-umschichtung-gleicher-tag.js`

`mfdepot.js:414`: `manuell === 'momentum'` prueft nicht `letzteAusfuehrungTag === heute`. Ergebnis nach Takt + Knopf: 2 Journalzeilen (automatik "34 Orders", hand "0 Orders"), `korbVerlauf` 1 -> 2, Trades unveraendert (die Ziele sind schon gehalten).
Kein Geldfehler; `offen` bleibt, `nachfassen` kauft nichts doppelt (`entfallen`, siehe D-ok-01/mfhandel `OK-04`).

---

## Geprueft, kein Fund

- **Gleichzeitige Takte / LAEUFT:** `LAEUFT = true` wird synchron nach `D()`-Pruefung gesetzt, `finally` setzt zurueck; zwei Takte koennen nicht ueberlappen. Zweiter Aufruf (Knopf) wird verworfen - nur stumm (D-10), nie doppelt.
- **Speichern:** `speichern()` ist `window.__save()` ohne `await`, ruft `api.storeSet('depot', D)` auf (IPC, `schreibAtomar` im Hauptprozess, serialisiert den Stand beim Aufruf). Zwischen `fuehreAus` und `speichern()` steht kein `await` -
  Handel, `letzteAusfuehrungTag`, `offen`, Journalzeile werden in EINEM Zug gespeichert (D-ok-02: jeder gespeicherte Stand ist atomar). Wird die App vorher beendet, fehlt alles gemeinsam; nach dem Neustart wird am selben Tag erneut zur selben Eroeffnung umgeschichtet.
  Scheitert `storeSet` (`ok: false`), warnt `save()` (Warnband), Speicher bleibt vorn, der naechste Takt/`save()` versucht es erneut - keine Doppelausfuehrung.
- **Neustart nach der Umschichtung (D-ok-02):** `letzteAusfuehrungTag = heute` -> nicht faellig; `offen` ueberlebt, 15:59 noch aktiv, 16:00 beendet mit Journalzeile "Nachfassen beendet"; genau eine `mfrebal`-Zeile.
- **Halb ausgefuehrt:** Verkaeufe gebucht, Kaeufe nicht, wenn Eroeffnungen fehlen: moeglich und gewollt (Nr. 94); `offen` haelt Verkaeufe und Kaeufe mit Budget; Nachfassen (D-ok-01) stellt Gleichgewichtung, Rangfolge, Bargeld 0 her, wenn nur ZIELE fehlen. Probleme nur bei fehlenden Bestaenden (D-04/D-05).
- **Ereignis-Stempel gegen Balken-Stempel, 13:30 / 14:30 UTC:** `test-daten/yahoo-nvda-ereignisse.json`: jedes Ereignis (Dividende 05.03.2024 14:30 UTC, 11.06.2024 13:30 UTC, Split 10.06.2024 13:30 UTC) steht mit identischem Stempel als Balken da.
  `t > kursT` / `t <= barZeit` zerbrechen daran nicht (D-ok-04, Winter und Sommer). Selbst ein Kurs-Stempel `now` statt 09:30 haette die sichere Richtung (Ex-Tag = Kauftag wird nicht gebucht).
- **nyTag/nyZeit an den Zeitumstellungen:** 2.730 Rundreisen (Tage 01.01.2026-30.06.2027 x 5 Uhrzeiten) ohne Abweichung; `eroeffnung()`-Bereich [von, bis) in Winter und Sommer richtig; Abruf mit `bis: now` um 09:35:01 enthaelt den 14:30-UTC-Balken.
- **kurse.js:** `zerlege` haelt `bars` und `roh` im Gleichschritt (Push nur nach `kursOk(c)`, Filter auf dieselben Grenzen); `ereignisseAus`/`ereignisseAb` richtig (Grenze einschliesslich, 400 Tage reichen fuer 63 Handelstage); `offenRoh` laesst die Eroeffnung leer statt auf den Schluss zu fallen.
- **Tagesdaten-Ablage:** Reihenfolge Teile -> mf_ereignisse -> mf_bezug -> Index; ein Leser sieht nur dann `bezug`, wenn `at` stimmt; ein gemischter Lesestand waehrend des Schreibens hat den alten `at` (gilt nicht als frisch). `mf_ereignisse` kann juenger sein als der Index,
  wird aber durch `t <= barZeit` nie zu frueh gebucht.
- **Sperre nach unvollstaendigem Abruf / Nachladen:** nach `FEHLVERSUCH` bleibt der Bestand unveraendert (1 h); verzoegert nur (derselbe Eroeffnungskurs gilt auch spaeter am Tag).
- **Montag-Abend-Start / spaeter Takt:** Umschichtung zur Montags-Eroeffnung ist auch nach 16:15 richtig gerangt (Stichtag Freitag), nur der Punkt ist falsch (D-03).
- **Tagespunkt:** Freitagspunkt im Montagstakt vor dem Handel, Montagspunkt am Dienstag mit neuem Buch (D-ok-05); `bargeldAm` zieht nur nach X gebuchte Dividenden ab; Kappung 750 richtig.
- **Kosten, Rundung, Reihenfolge:** Nachfassen mit 20 Bp je Seite wie `fuehreAus`; Kaeufe in Rangfolge; Rundung Math.round (Umschichtung) vs. floor (Nachfassen) wird durch die Verkleinerung in `fuehreAus` aufgefangen (letzte Position 4.661 statt 5.000 = Kosten, wie in der Messung).
- **Umschichtung + Nachfassen im selben Takt:** Nachfassen laeuft VOR dem Plan; nach der Umschichtung ist `fl.faellig` falsch -> kein zweiter Lauf im selben Takt.

## Offen / Vermutung (nicht nachgewiesen, nicht als Fund gefuehrt)

1. **Ladezeit `at` = ENDE des Ladens (`tagesdatenSchreiben(..., Date.now(), ...)`):** ein Lauf, der kurz vor 16:15 New York beginnt und danach endet, haelt Balken des Tages je Wert getrennt (`ohneLaufendenBalken` mit `Date.now()` je Wert), der Bestand gilt als frisch; `stichtagPruefen` faengt es per 95 %-Regel, Nachladen laedt aber nicht neu ("frisch"). Die Folge wirkt erst, wenn ein Lauf in diesem 5-Minuten-Fenster startet (nur wenn der Bestand schon vorher veraltet war). Nicht erzeugt.
2. **Positionen von vor Nr. 87 (das laufende Buch seit 25.08.) haben kein `kursT`:** Beginn = `seit` (Takt-Zeit). Hat der Kauf am Tag X den Schluss von X-1 benutzt und liegt der Ex-Tag auf X vor der Takt-Zeit, wird die Ausschuettung (Anspruch ja) nicht gebucht. Betrifft hoechstens den Ex-Tag 25.08.; Betrag klein, Positionen werden am 23.11. ohnehin ersetzt/gehalten.
3. **Verhalten von Yahoo um 09:35-09:40:** ob ein Abruf mit `period2 = now` den Balken des Tages mit Eroeffnung schon fuehrt (Stempel 09:30), oder nur die "Abschlusskerze aus dem aktuellen Quote" (kurse.js, Zeitstempel = Quote-Zeit, Eroeffnung evtl. leer) - ohne Netz nicht pruefbar. Fehlt sie, fasst Nr. 94 bis 16:00 nach (gesund, ausser bei D-04/D-05).
4. **Luecken im Verlauf bei mehrtaegiger Pause:** `tagespunkt` schreibt nur einen Punkt fuer den JUENGSTEN abgeschlossenen Tag, nie fuer uebersprungene Tage (A5 sagt "je abgeschlossenem Handelstag"). Anzeige, kein Geld.
5. **`save()` kann synchron werfen (`Berichte.exportAnalysis`)** - dann endet der Takt mit "Fehler:", der Stand liegt im Speicher (keine Doppelausfuehrung), gespeichert wird beim naechsten `save()` irgendeiner Stelle. Nicht beobachtet.
6. **Eroeffnung/Schluss-Konsistenz fuer Werte, deren Abruf am Stichtag in `ladenAnnehmen` (95 %) durchrutschte:** bis zu 9 Reihen mit altem letztem Balken fliessen mit dem Stand des Vortags in die Rangfolge (kleine Abweichung, zaehlt nicht als Fund).
