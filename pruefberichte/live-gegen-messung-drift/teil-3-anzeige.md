# Live gegen Messung — Ergebnis-Drift, Teil 3: Anzeige und Texte

Stand 04.10.2026 (Zweig `pruefung/live-gegen-messung-drift`). Simulation mit virtuellem Kapital, keine Anlageberatung.

Messung: `studien/vorregistrierung-2026-10-04-ergebnis-drift/` (Nr. 88; `ERGEBNIS.md`, `ergebnis.json`, `VORREGISTRIERUNG.md`).
Stufe 1 „nicht entscheidbar" (H = 60: A +2,09 Pp t 1,67; B netto +1,39 Pp t 1,97; Tor t ≥ 2,5), Stufe 2 Buch +84,2 % gegen
SPY +81,2 %, 16 von 200 Zufallsbüchern darüber, kein Vorwärtstest. Gemessen ist **nur die Kaufseite**, oberstes **Zehntel**,
Vergleichsmenge 63 Handelstage, Kauf zur Eröffnung des Einstiegstags.

Tests: `teil-3-anzeige.tests.js` (Vertrag `module.exports = function (Z) {…}`; Selbstlauf
`node pruefberichte/live-gegen-messung-drift/teil-3-anzeige.tests.js [T5]`, PRUEF_WURZEL-fähig). Jede Zahl der Messung
liest der Test aus `ergebnis.json` bzw. per Textmarke aus den `.md`; eine fehlende Marke wirft (Testdefekt, kein Befund).
Lauf am 04.10.2026: 10 × „ZEIGT ABWEICHUNG", 4 × „kein Unterschied" (Gegenproben T7–T10).

| Messung (Datei:Zeile) | App (Datei:Zeile) | Abweichung | Bewertung A/B/C |
|---|---|---|---|
| ERGEBNIS.md:3, ergebnis.json `urteil.urteil` „nicht entscheidbar" | index.html:2347-2351 (sichtbarer Messkasten im Drift-Panel) | zeigt „Gemessen ab 2015: +10,44 % p. a. bei t = 3,04" (marktneutral, 21.08.2026, vor der Zeitzonen-Korrektur); Nr. 88 fehlt | B (T1) |
| ERGEBNIS.md:3; VORREGISTRIERUNG.md:35 (Zehntel), :13 (nur Kaufseite) | app-shell.js:1252-1257 (`regeln.mf.drift`, i-Knopf index.html:2283) | „Was gemessen ist … +10,44 % p. a. bei t = 3,04"; „oberstes Fünftel"; „es braucht beide Beine – long allein ist überwiegend Marktbeta" | B (T2) |
| ergebnis.json `stufe1`, `stufe2` | app-shell.js:1095 (`vermoegen.buecher`, i-Knopf index.html:1260) | „Ergebnis-Drift nach Zeitzonen-Korrektur 8,44 statt 14,07 % p.a.", „beide halten über die volle Historie" (Stand 23.08.) | B (T3) |
| ERGEBNIS.md:3 (Stufe-1-Urteil, t 1,67 / 1,97) | strategien.js:107, :111-112 (Stand-Chip, Belegstand-Fenster); studienurteile.js:164-175 | Stufe-1-Urteil der Nr. 88 steht an keiner Stelle der App; der Belegstand zeigt „t = 1,7–2,0" (Kontrollmessung 23.08.) und „+10,44 % p. a. bei t = 3,04" | B (T4) |
| ERGEBNIS.md:3 (Tor t ≥ 2,5; bei t 2,22 „nicht entscheidbar") | driftui.js:157-172 (`zeigeErgebnis`, Knopf „Neu rechnen") | Kachel „Ertrag p. a. (marktneutral)" (Long-Short, in Nr. 88 nicht gemessen); t ≥ 2 heißt „überzufällig" | B (T5) |
| VORREGISTRIERUNG.md:34-35, :38-41 (Zehntel, 63 Tage, 0,210/0,134/0,081 Pp) | index.html:2299-2327 („(geprüft)"), driftui.js:254-281 („aus der gemessenen Konfiguration"), drift.js:38-44 | 20 % und 120 Tage als „geprüft"; 10 Bp je Seite; Tooltip „erst ab rund 60 Tagen trägt er" | B (T6) |
| ergebnis.json `stufe2` | studienurteile.js:164-175 (`RUECKBLICK.drift`) | keine – 10 Felder stimmen, Zeile sagt „nur Kaufseite – nicht die Regel dieses Buchs" | – (T7) |
| — | mfdepot.js:787-794, strategien.js:401-412 (`BUCH_SATZ`) | keine – Karte und Antwort-Seite zeigen Zeile und Satz | – (T8) |
| VORREGISTRIERUNG.md:70 (Start 100.000, SPY-Gesamtertrag mit Ausschüttungen) | mfdepot.js:633-640 (`vergleich`), massstab.js:295 | keine – Gesamtertrag beider Seiten, ab Anlage des Buchs, Start 100.000 $ | – (T9) |
| — (Messung hat keine Shorts) | bestandui.js:67, depot.js:4621-4632 | keine – Leerverkauf steht als „Ergebnis-Drift hält (short)" | – (T10) |
| VORREGISTRIERUNG.md:86 (Totalverlust; nur Kaufseite gemessen) | mfhandel.js:460-476 (`reihenendeJournal`) | beim Leerverkauf: „wäre es eine Insolvenz, hätte die Messung 0 gebucht" – für einen Short wäre Kurs 0 der beste Fall; die Messung hat keine Shorts | B (T11) |
| VORREGISTRIERUNG.md:38 (Kauf zur Eröffnung des Einstiegstags) | mfdepot.js:500-501 (Journal Drift-Abgleich), mfhandel.js:497/530 | „Neue Signale nur, wenn jünger als 5 Handelstage – ein 40 Tage altes Signal hat den Großteil seiner Wirkung hinter sich": eine nicht gemessene Begründung | C (T12) |
| ERGEBNIS.md:3 | drift.js:15-31, mfdepot.js:12-13 (Kopfkommentare) | „GEMESSEN … +10,44 % p. a. t = 3,04", „Es braucht BEIDE Beine", „t = 1,7-2,0" | C (T13) |
| wiki/belegstand.md:143-160 (Abschnitt Nr. 88) | wiki/belegstand.md:267 (Tabelle „Nicht entscheidbar") | „t 1,7–2,0 nach Zeitzonen-Korrektur, Protokolle im Datenordner" – die eigene Datei sagt t 1,67 / 1,97, Fundstelle Nr. 88 | C (T14) |

Kein Fund der Klasse A: Teil 3 prüft nur Anzeige und Text, keine Buchung.

## Funde

**T1 – Sichtbarer Messkasten zeigt die alte Rendite als Messung.** Unter „Was wäre heute offen?" steht dauerhaft „Gemessen ab
2015: +10,44 % p. a. bei t = 3,04" (index.html:2349). Die Zahl ist die marktneutrale Long-Short-Rechnung vom 21.08.2026, also
**vor** der Zeitzonen-Korrektur (strategien.js:111 sagt selbst „Die Zahlen darunter sind VOR der Zeitzonen-Korrektur"). Der
Kasten nennt die Messung Nr. 88 („nicht entscheidbar", t 1,67 / 1,97) nicht. Folge für den Anwender: das sichtbarste Messurteil
zum Drift-Buch ist ein überholtes, und es klingt nach Beleg (Regel D2 in CLAUDE.md). Test `T1`.

**T2 – Erklärfenster „Ergebnis-Drift" beschreibt eine andere Regel und eine überholte Messung.** app-shell.js:1252-1257
(`regeln.mf.drift`): „Was gemessen ist … +10,44 % p. a. bei t = 3,04"; „oberstes Fünftel" (gemessen: oberstes Zehntel,
≥ 90. Perzentil); „es braucht beide Beine – long allein ist überwiegend Marktbeta". Nr. 88 hat nur die Kaufseite gemessen und
gegen alle Melder +1,58 Pp gefunden (t 2,72, Beta-frei gegen das Klassenmittel). Das Buch lag gegen den S&P 500 fast gleichauf,
im Bereich des Zufalls. Die Messung sagt also weder „Marktbeta" noch „trägt". Folge: der Anwender liest im i-Fenster
Fünftel und beide Beine als gemessen. Test `T2`.

**T3 – „Die zwei Bücher" nennt den Rohlauf vom 23.08.** app-shell.js:1095: „beide halten über die volle Historie … Ergebnis-Drift
nach Zeitzonen-Korrektur 8,44 statt 14,07 % p.a." Diese Zahlen kommen weder in `ergebnis.json` noch in ERGEBNIS.md vor. Folge: am
Bestand steht eine Rendite p. a. als Stand, die Nr. 88 ersetzt hat (Buch 13,01 % p. a. gegen SPY 12,63 %, Zufall). Test `T3`.

**T4 – Das Stufe-1-Urteil der Nr. 88 steht nirgends in der App.** Die App zeigt von Nr. 88 nur die Rückblick-Zeile der Stufe 2
(studienurteile.js:164). Der Stand-Chip (strategien.js:107) sagt „Neumessung offen … kein Vorwärtstest angezeigt", das
Belegstand-Fenster (strategien.js:111-116) zeigt die Kontrollmessung („t = 1,7–2,0: nicht entscheidbar") und darunter
„+10,44 % p. a. bei t = 3,04". Eine Suche über alle App-Dateien nach „t 1,97", „t 1,67" oder „+1,39 Pp" findet nichts.
Folge: der Anwender sieht für Stufe 1 nur alte Zahlen, die den Messungen von heute widersprechen. Test `T4`.

**T5 – „Neu rechnen" zeigt eine marktneutrale Rendite und nennt t ≥ 2 „überzufällig".** driftui.js:157-172 gibt die
Long-Short-Rechnung aus `Drift.durchlauf` als Kachel „Ertrag p. a. (marktneutral)" aus, mit „überzufällig (t ≥ 2)" ab t = 2.
Die Rechnung läuft auf dem Universum der App (nur heute noch notierte Werte), ohne Kosten der Klasse, ohne Bezug zu Nr. 88. Im
Test mit t = 2,22 (dem t der Messung bei H = 20, Urteil dort „nicht entscheidbar", Tor 2,5) steht „überzufällig". Folge: die App
kann eine eigene, schwächere Prüfung als Urteil anzeigen, das dem gemessenen widerspricht. Test `T5`.

**T6 – Die Parameterfelder heißen „geprüft", gemessen ist eine andere Regel.** index.html:2303-2317 markiert 60 Tage, 20 % und
120 Tage als „(geprüft)". driftui.js:278 ergänzt notfalls „(aus der gemessenen Konfiguration)". Der Tooltip zu „Halten" sagt
„erst ab rund 60 Tagen trägt er". Nr. 88: oberstes Zehntel (10 %), Vergleichsmenge 63 Handelstage, Kosten 0,210 / 0,134 /
0,081 Pp je Umlauf nach Klasse, und bei 60 Tagen „nicht entscheidbar". Die Zeile darüber (index.html:2297, „ihre eigene Messung
steht aus") stimmt; die Felder darunter widersprechen ihr. Test `T6`.

**T7 – Gegenprobe Rückblick-Zahlen.** Alle zehn Felder von `RUECKBLICK.drift` stimmen mit `ergebnis.json`: Buch +84,2 %, SPY
+81,2 %, 16/200, kein Vorwärtstest, Rückschläge −21,6 / −24,5 %, 40 Plätze. Die Zeile sagt „nur Kaufseite – nicht die Regel dieses
Buchs". Kein Unterschied. Test `T7`.

**T8 – Gegenprobe BUCH_SATZ.** Die Karte des Drift-Buchs (mfdepot.js:791-794, in der Sandbox gezeichnet) und die Antwort-Seite
(strategien.js:410, Funktion `rueckblickZeilen` herausgelöst) zeigen die Rückblick-Zeile, und beide setzen den Satz „seine eigene
Regel (Kauf und Leerverkauf, 60 Handelstage) ist nicht gemessen" darunter. Weitere Leser von `rueckblickText` gibt es nicht.
Kein Unterschied. Test `T8`.

**T9 – Gegenprobe Vergleich mit SPY.** `MFDepot.vergleich('drift')` rechnet mit `punktKurs` und `buchAusschuettungen`. Das
ergibt den SPY-Gesamtertrag (im Test mit eingepflanzter Ausschüttung genau das Soll), das Buch bucht seine Ausschüttungen, und
der Vergleich beginnt an der Anlage des Buchs mit 100.000 $. Das ist dieselbe Größe wie die Messung (VORREGISTRIERUNG.md:70: Start
100.000 $, SPY-Gesamtertrag mit Ausschüttungen). Der Zeitraum ist ein anderer (Vorwärts statt Rückblick), und das Datum sagt es.
Unterschiede der Regel (Bargeld statt Rest in SPY, Leerverkäufe) gehören zu Teil 1/2. Kein Unterschied in der Anzeige.
Test `T9`.

**T10 – Gegenprobe Short-Kennzeichnung.** `DepotAPI.mittelfrist` gibt `richtung` −1 weiter, `mittelText` schreibt
„Ergebnis-Drift hält (short)". Kein Unterschied. Anmerkung: dass die Messung keine Shorts kennt, steht nur an Karte und
Antwort-Seite (BUCH_SATZ), nicht im Bestand. Test `T10`.

**T11 – Reihenende eines Leerverkaufs: falscher Bezug auf die Messung.** mfhandel.js:476 hängt an **jede** Reihenende-Zeile,
auch an die eines Leerverkaufs, „wäre es eine Insolvenz, hätte die Messung 0 gebucht". Für einen Short wäre Kurs 0 der beste Fall:
im Test 10.000 $ statt der gebuchten 9.000 $. Die Messung Nr. 88 hat keine Leerverkäufe. Folge: der Anwender liest beim Short
ein Verlustrisiko heraus, das es in dieser Richtung nicht gibt. Test `T11`.

**T12 – Journalbegründung „jünger als 5 Handelstage".** mfdepot.js:500-501 schreibt bei jedem Drift-Abgleich „ein 40 Tage altes
Signal hat den Großteil seiner Wirkung hinter sich". Das Buch eröffnet auch ein 3 Tage altes Signal (im Test geprüft). Die
Messung kauft nur zur Eröffnung des Einstiegstags und hat den Verlauf der Wirkung über die Tage nicht gemessen. Eine
Abweichung der Regel (Teil 1), hier nur als Text. Test `T12`.

**T13 – Kopfkommentare mit überholten Belegen.** drift.js:15-31 („GEMESSEN … +10,44 % p. a. t = 3,04", „Es braucht BEIDE
Beine") und mfdepot.js:12-13 („t = 1,7-2,0"). Nicht sichtbar für den Anwender, aber die Vorlage, aus der T1/T2/T4 abgeschrieben
sind (Regel D2: der Beleg steht im Protokoll, nie im Code). Test `T13`.

**T14 – Belegstand-Wiki widerspricht sich selbst.** wiki/belegstand.md:267 führt das Ergebnis-Drift-Buch in der Tabelle
„Nicht entscheidbar" mit „t 1,7–2,0 nach Zeitzonen-Korrektur" und der Fundstelle „Protokolle im Datenordner". Der Abschnitt
derselben Datei (Zeile 143 ff.) nennt Nr. 88 mit t 1,67 / 1,97. Keine App-Anzeige. Test `T14`.
