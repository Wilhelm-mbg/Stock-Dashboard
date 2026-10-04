# Live gegen Messung — Ergebnis-Drift-Buch, Teil 2: Buchführung

Durchsicht vom 04.10.2026, Zweig `pruefung/live-gegen-messung-drift`. Das Soll ist die gemessene Regel
(`studien/vorregistrierung-2026-10-04-ergebnis-drift/`: VORREGISTRIERUNG.md A4, A7, Teil C 7–10; `buch.js`; `konfig.js`;
ERGEBNIS.md), das Ist der App-Code (`mfhandel.js` driftAbgleich/bewerteDrift/bucheMassnahmen/reihenendeAusbuchen/stempleKursT,
`mfdepot.js` takt/buchInit/tagespunkt, `drift.js` heute/reaktionstag). Teilgebiet nur **Buchführung**. Signalbildung
(Fünftel statt Zehntel, 120 statt 63 Tage Vergleichsmenge, Yahoo-Überraschung statt Bilanz-Tafel) ist Teil 1 und hier
nur gestreift, wo sie Geld bewegt (K8).

Kleinsttests: `teil-2-buchfuehrung.tests.js` (Vertrag `module.exports = function (Z) → [{nr, titel, lauf}]`), Selbstlauf aus
der Repo-Wurzel: `node pruefberichte/live-gegen-messung-drift/teil-2-buchfuehrung.tests.js [K3]`. Feste Uhr über
`MH.nyZeit` (America/New_York), kein `Date.now`, kein Netz; unter `TZ=UTC`, `TZ=Pacific/Auckland` und `TZ=America/Los_Angeles`
zeichengleiche Ausgabe. Wo es geht, laufen dieselben Kunstkurse durch `buch.js simuliere` (Soll) und durch die App-Funktion;
K2 und K11 fahren `mfdepot.js takt` in einer vm-Sandbox (Attrappen nach `pruefberichte/live-gegen-messung-momentum.test.js`,
`drift_termine`, `drift_markt`, `mf_ereignisse` im Speicher). Ergebnis heute: **14 Abweichungen (K1–K14: 13 × A, 1 × B),
5 Gegenproben ohne Unterschied (K15–K19).**

Pfade unten: `VR` = `studien/vorregistrierung-2026-10-04-ergebnis-drift/VORREGISTRIERUNG.md`, `buch.js`/`konfig.js` im selben Ordner.

| Messung (Datei:Zeile) | App (Datei:Zeile) | Abweichung | Bewertung A/B/C |
|---|---|---|---|
| VR:71 „40 gleich große Plätze … Buchwert / 40“; konfig.js:50 `PLAETZE: 40`; buch.js:127, :133 | mfhandel.js:499 `budgetAnteil 0.05`, :542-545 (keine Platzgrenze, nur Bargeld) | K1: 5 % je Position, ≈ 20 Positionen + Kleinstrest statt 40 zu 2,5 % | A |
| VR:70 Start voll in SPY, VR:71/83 Käufe aus SPY, Erlöse in SPY; buch.js:63, :69-73, :136-137 | mfdepot.js:103-105 `buchInit` (cash 100.000); mfhandel.js:519, :547 | K2: nicht gebundenes Kapital liegt bar ohne Ertrag statt in SPY | A |
| VR:71 Annahmezeit → Überraschung → Kürzel; buch.js:22, :61 | drift.js:121 (nur Tagesindex), :281 (nur `nochTage`); mfhandel.js:528 | K3: Reihenfolge am Tag = Schlüsselfolge von `drift_termine` | A |
| VR:38 „Kauf zur Eröffnung des Einstiegstags“; buch.js:131, :140 | mfdepot.js:48 `preise` = letzter Schluss, :486; mfhandel.js:536, :548; drift.js:273 | K4: Einstieg (und Ausstieg) zum Schluss statt zur Eröffnung | A |
| VR:38 „vor 09:30:00 … derselbe Handelstag, sonst der nächste“; Machbarkeit zeit.js:74-79 | drift.js:76-78 `reaktionstag` (nur ≥ 20 UTC verschiebt) | K5: Meldung während der Handelszeit → App kauft am selben Schluss, Messung erst zur nächsten Eröffnung | A |
| VR:38 „Verkauf zur Eröffnung H Handelstage später“, H = 60; buch.js:109 | mfhandel.js:508-509 `(now − seit)/Tag × 252/365 ≥ 60` | K6: Kalenderuhr 86,9 Tage ab dem Takt statt 60 Handelstage | A |
| VR:80, VR:173 (C8) halbe Umlaufkosten je Klasse + 0,5 Bp SPY; konfig.js:37-38; buch.js:112, :136 | mfhandel.js:495 `kostenBp 10` für alle | K7: 0,20 Pp je Umlauf statt 0,220 / 0,144 / 0,091 Pp | A |
| VR:12 (A1 „nur die Kaufseite“), VR:71 nur oberstes Zehntel; buch.js:48 | drift.js:143 (unterstes Fünftel → −1), :271; mfhandel.js:517, :548, :563, :644 | K8: App eröffnet Leerverkäufe (zahlt Ausschüttungen) | A |
| — (Folge aus der App-Rechnung selbst) | mfhandel.js:548 `einstand = kurs × (1 + k)`, :517, :563 `2 × einstand − kurs` | K10: Leerverkauf läuft praktisch kostenfrei, Kosten erscheinen als Gewinn | A |
| VR:86 Insolvenz = 0, gebucht am ersten Handelstag danach; buch.js:84-96 | mfhandel.js:426-438 (fünf Balken, immer letzter Schluss; im Kommentar :418-421 als bewusst benannt) | K9: Totalverlust nicht gebucht, fünf Tage zu spät | A |
| VR:71 Kauf nur am Einstiegstag, VR:38 Verkauf am 60. Handelstag zur Eröffnung | mfdepot.js:941 (Takt nur bei offener App), :486; mfhandel.js:497, :508-519, :530 | K11: nach einer Pause wird zum Kurs des Takts gekauft/verkauft | A |
| VR:71 „Meldungen … mit Einstiegstag heute“ | mfhandel.js:497 `maxAlterTage 5`, :530-532 | K12: Pause > 5 Handelstage → Signal verworfen, Messung hatte gekauft | A |
| VR:71 „Sind alle Plätze besetzt, verfällt die Meldung“; buch.js:133, :135 | mfhandel.js:530, :545 (Grenze 5 Tage, kein Verfall) | K13: verfallene Meldung wird Tage später nachgekauft | A |
| VR:86 Reihenende, VR:177 (C9), VR:71 „fehlt die Eröffnung: letzter Schlusskurs“; buch.js:84-96, :124 | mfhandel.js:510-514, :433, :562 | K14: Position ohne Reihe bleibt ewig offen, zum Einstand bewertet | B |
| VR:71, VR:171 (C7) Firma = CIK; buch.js:130 | mfhandel.js:534-535 (Kürzel) | K15: keine (im Universum keine Firma mit zwei Kürzeln) | — |
| VR:179 (C10) Stückzahl über die Nacht; buch.js:98-105 | mfhandel.js:614-617, :644; mfdepot.js:384 vor :486 | K16: keine (Anspruch gleich; Ziel des Geldes: K2) | — |
| Panel bereinigt (buch.js rechnet auf `bEroeffnung/bSchluss`) | mfhandel.js:620-639 | K17: keine (Split wertneutral) | — |
| VR:71 „Kein Kredit, kein negativer SPY-Bestand“; buch.js:137 | mfhandel.js:543-547 | K18: keine | — |
| VR:71 Buchwert einmal je Tag, gleicher Betrag; buch.js:121-127 | mfhandel.js:527, :542 | K19: keine (Höhe: K1) | — |

## Die Funde

**K1 — Platzzahl und Positionsgröße.** Die Messung hat 40 gleich große Plätze, Kaufbetrag = Buchwert zur Eröffnung / 40
(VR:71, konfig.js:50, buch.js:127, :133). Die App kennt keine Plätze: jede Eröffnung bekommt 5 % des Buchwerts, gedeckelt nur
durch das Bargeld (mfhandel.js:499, :542-545). Kleinsttest mit 40 Kaufsignalen an einem Tag und 100.000 $: Messung 40 Positionen
zu 2.500 $ (eine mit dem Rest), App **21 Positionen zu 4.995 $, die letzte ein Kleinstrest zu 0,02 $**, 19 Signale verworfen.
Folge: doppelte Größe je Wette, halbe Streuung — das Buch ist ein anderes Portfolio als das gemessene. Test `K1`.

**K2 — Kapital außerhalb der Aktien.** Die Messung startet voll in SPY, bezahlt Käufe durch SPY-Verkauf und legt Erlöse und
Ausschüttungen sofort in SPY an (VR:70, :83; buch.js:63, :69-73, :136-137) — im Rückblick lagen 10,5 % des Kapitals im Mittel in
SPY (ERGEBNIS.md: 89,5 % in Aktien). Die App legt ein Buch mit 100.000 $ **Bargeld** an (mfdepot.js:103-105) und lässt alles nicht
Gebundene bar liegen (mfhandel.js:519, :547; bucheMassnahmen :645). Kleinsttest (Sandbox, `mfdepot.js takt` zweimal mit fester
Uhr): ohne Signal, SPY +10 % in zehn Handelstagen → App-Tagespunkt **100.000 $**, Messung **110.000 $** = Maßstab. Jeder bare
Dollar fehlt mit dem Marktertrag; gegen den S&P-500-Vergleich der Karte erscheint das als Unterrendite des Drifts. Test `K2`.

**K3 — Rangfolge am Tag.** Messung: früheste Annahmezeit, dann größere Überraschung, dann Kürzel (VR:71, buch.js:22, :61).
App: `Drift.heute` ordnet Ereignisse nur nach Tagesindex (drift.js:121) und `offen` nur nach `nochTage` (drift.js:281); innerhalb
eines Tages gilt die Schlüsselfolge des Bestands `drift_termine`. Kleinsttest: ZZZ meldet 06:00 New York (Überraschung 5), AAA
08:00 (Überraschung 9), Geld für genau eine Position: **Messung kauft ZZZ, App kauft AAA**. Wirkt, sobald das Bargeld knapp ist
— bei 5 % je Position nach rund 20 Käufen (K1). Test `K3`.

**K4 — Einstiegskurs.** Messung: Kauf und Verkauf zur Eröffnung (VR:38; buch.js:110, :131, :140). App: `preise` ist der letzte
Schluss im Tagesbestand (mfdepot.js:48), gekauft und verkauft wird zum Schluss (mfhandel.js:510, :536, :548); auch
`Drift.heute` nennt als `einstieg` den Schluss des Reaktionstags (drift.js:273). Kleinsttest: Vortag 100, Eröffnung 105, Schluss
110 → **Messung 105,00, App 110,00 (Einstand 110,11)**: 4,5 % weniger Stück für denselben Betrag; der Sprung zwischen Eröffnung
und Schluss des Einstiegstags (+4,8 %) gehört der Messung, nicht der App. Test `K4`.

**K5 — Einstiegstag bei einer Meldung während der Handelszeit.** Messung: vor 09:30:00 New York derselbe Tag, sonst der nächste
(VR:38; Machbarkeit `zeit.js:74-79`). App: verschiebt nur ab 20:00 UTC oder bei „ohne Uhrzeit“ (drift.js:76-78). Kleinsttest
am 20.10.2026: Meldung 11:00 New York → **Messung Eröffnung 21.10., App Schluss 20.10.** — die Nacht nach der Meldung ist in der
App, nicht in der Messung. 08:00 und 17:00 landen am selben Tag wie in der Messung (nur Schluss statt Eröffnung, K4). Gehört
inhaltlich auch zu Teil 1 (Zeitstempel der Quelle); hier, weil es den Einstiegskurs bestimmt. Test `K5`.

**K6 — Haltedauer.** Messung: Verkauf zur Eröffnung des 60. Handelstags (VR:38, buch.js:109). App: `(now − seit) / Tag × 252/365
≥ 60`, also 86,9 Kalendertage ab dem Takt des Kaufs (mfhandel.js:508-509); `heute.faellig` aus drift.js wird nicht benutzt.
Kleinsttest mit täglichem Takt 17:00: Kauf 05.10.2026 → **Messung verkauft 30.12.2026 zur Eröffnung (Tag 60), App 31.12.2026
zum Schluss (Tag 61)**; derselbe Zeitraum ohne Feiertage: Messung Tag 60, App **Tag 63**. Die App hält systematisch ein bis drei
Handelstage länger — je nachdem, wie viele Feiertage im Fenster liegen. Test `K6`.

**K7 — Kosten.** Messung: halbe Umlaufkosten der Klasse je Seite (0,105 / 0,067 / 0,0405 %) plus 0,5 Bp auf jeden SPY-Handel
(VR:80, :173; konfig.js:37-38; buch.js:112, :136). App: 10 Bp je Seite für jede Aktie (mfhandel.js:495), keine Klassen, kein SPY.
Kleinsttest, Umlauf bei flachem Kurs: **50-250 Messung 0,220 Pp, App 0,200 Pp; 250-1000 0,144 gegen 0,200; ab1000 0,091 gegen
0,200**. Bei ab1000 zahlt die App gut das Doppelte, in der größten Klasse (50-250, 68 % der Ereignisse) etwas zu wenig. Test `K7`.

**K8 — Leerverkauf.** Die Messung handelt nur die Kaufseite des obersten Zehntels (VR:12, :71; buch.js:48). Die App bekommt aus
`Drift.zuordnen` auch das unterste Fünftel als `richtung −1` (drift.js:143, :271) und eröffnet dafür Leerverkäufe, die Bargeld
binden wie ein Kauf (mfhandel.js:547-548), linear bewertet werden (:517, :563) und Ausschüttungen zahlen (:643-645). Kleinsttest:
Überraschung −9 → **App eröffnet einen Leerverkauf über 4.995 $**, bei +20 % Kurs fällt das Buch um rund 999 $, eine Ausschüttung
von 1 $ je Stück kostet 49,95 $; **Messung: kein Handel**. Test `K8`.

**K10 — Leerverkauf praktisch ohne Kosten.** (Innerhalb der App-Regel; mit K8 entfiele es.) Der Einstand trägt die Kosten
(`kurs × (1 + k)`, mfhandel.js:548); beim Leerverkauf geht er in `2 × einstand − kurs` ein (:517, :563) — die Kaufkosten werden
damit zum Buchgewinn, und der Schlussabschlag (:518) hebt sie fast genau auf. Kleinsttest bei flachem Kurs 100 über 4.995 $:
**Kauf-Umlauf kostet 9,99 $, Leerverkauf-Umlauf 0,01 $**; gleich nach dem Leerverkauf steht das Buch bei 100.005 $, also über
dem Start. Test `K10`.

**K9 — Reihenende.** Messung: am ersten Handelstag nach der letzten Zeile, Insolvenz und Zwangs-Delisting = 0, sonst letzter
Schluss, Erlös in SPY (VR:86; buch.js:84-96). App: erst nach fünf SPY-Balken ohne neuen Balken, immer zum letzten Schluss, Erlös
bar (mfhandel.js:426-438; der Kommentar :418-421 benennt das als bewusste Abweichung, der Grund ist der App unbekannt).
Kleinsttest: Reihe endet mit Schluss 2,00 (Insolvenz), 250 Stück → **Messung bucht am nächsten Handelstag 0 $, App fünf Balken
später 500 $**. Bei echten Insolvenzen ist das zu viel Geld; die fünf Tage Wartezeit sind vertretbar (Aussetzer der Quelle),
der fehlende Totalverlust nicht ohne eine Quelle für den Grund. Test `K9`.

**K11 — Verpasste Takte.** Die App handelt nur, wenn sie läuft (`takt` alle 30 Minuten, mfdepot.js:941). Nach einer Pause kauft
sie Signale bis 5 Handelstage alt (mfhandel.js:497, :530) und schließt Fällige — beides zum Schluss des Takttags. Kleinsttest
(Sandbox, `mfdepot.js takt`, App aus vom 30.10. abends bis 05.11.2026 17:00): **AAA Messung Kauf 02.11. zu 105,00, App 05.11. zu
116,00; OLD (60. Handelstag am 02.11.) Messung Verkauf zu 50,00, App 05.11. zu 45,00 = −5.000 $ auf 1.000 Stück.** Die Pause
verschiebt Einstand und Ausstieg um die Bewegung der verpassten Tage — in beide Richtungen, ohne dass die Messung das kennt. Test `K11`.

**K12 — Pause länger als fünf Handelstage.** Messung: Kauf am Einstiegstag (VR:71). App: Signal älter als 5 Handelstage wird
verworfen (mfhandel.js:530-532). Kleinsttest, erster Takt sieben Handelstage nach der Meldung: **Messung 1 Kauf, App keiner**
(„Signal ist 7 Handelstage alt (Grenze 5)“); die Position fehlt für die ganzen 60 Tage. Test `K12`.

**K13 — Verfallene Meldung wird nachgekauft.** Messung: ist am Einstiegstag kein Platz oder kein SPY-Bestand da, verfällt die
Meldung endgültig (VR:71; buch.js:133, :135). App: verwirft sie heute („Bargeld reicht nicht“, mfhandel.js:545) und kauft sie an
jedem der nächsten fünf Handelstage, sobald Geld frei wird (:530). Kleinsttest: Einstieg 25.05.2026 ohne Geld, Verkauf von HELD
am 27.05. → **App kauft AAA am 27.05. zu 104,10 für 4.990 $, Messung kauft nicht** (1 verfallen). Der Spätkauf hält wieder 60
Tage ab dann. Test `K13`.

**K14 — Position ohne Reihe.** Messung: Reihenende am ersten Handelstag nach der letzten Zeile zum letzten Schluss; fehlt nur die
Eröffnung, gilt der letzte Schlusskurs (VR:71, :86, :177; buch.js:84-96, :124). App: fehlt die Reihe im Bestand ganz, bleibt die
fällige Position offen („fällig, aber kein frischer Kurs – bleibt offen“, mfhandel.js:510-514), `reihenendeAusbuchen` überspringt
sie (:433), und `bewerteDrift` zeigt sie zum Einstand mit Kosten (:562). Kleinsttest: letzter Schluss 80, Einstand 100,10, 100
Stück → **App zeigt 10.010 $ und hält sie unbegrenzt; Messung bucht sie zu 80 aus (8.000 $)**. B, weil es nur greift, wenn eine
Reihe aus dem Bestand verschwindet (z. B. Wert aus dem Universum genommen); dann aber auch dauerhaft gebundenes Geld. Test `K14`.

## Gegenproben ohne Unterschied

- **K15 Schon gehaltene Firma:** beide kaufen kein zweites Mal (Messung Schlüssel CIK, App Kürzel; im App-Universum von 193
  Werten hat keine Firma zwei Kürzel). Test `K15`.
- **K16 Ausschüttungsanspruch:** Ex-Tag am Kauftag ohne, am Folgetag und am Verkaufstag mit Anspruch — Messung und App je
  1,00 $ je Stück (mfdepot.js bucht die Maßnahmen :384 vor dem Abgleich :486). Wohin das Geld geht, ist K2. Test `K16`.
- **K17 Split:** 2:1 bei Kurs 120 → 60 lässt den Wert in der App gleich (2.200 $ vor und nach); die Messung rechnet bereinigt. Test `K17`.
- **K18 Kein Kredit:** App-Bargeld und Messungs-SPY-Bestand enden bei 30 Signalen und wenig Geld genau bei 0. Test `K18`.
- **K19 Ein Betrag je Tag:** alle Käufe eines Tags bekommen in beiden denselben, vor dem ersten Kauf bestimmten Betrag
  (App 4.995 $, Messung 2.500 $ — die Höhe ist K1). Test `K19`.

## Ausgabe des Laufs (heutiger Code)

```
K1  ZEIGT ABWEICHUNG: 40 Kaufsignale an einem Tag, 100.000 $: Messung kauft 40 Positionen (je 2.500,00 $ = Buchwert/40, 1 davon mit dem Rest), App kauft 21 (je 4.995,00 $ = 5 % des Buchwerts; die letzte ein Kleinstrest zu 0,02 $), 19 Signale verworfen ("Bargeld reicht nicht") - doppelte Positionsgroesse, halbe Streuung.
K2  ZEIGT ABWEICHUNG: neues Drift-Buch (buchInit) ohne ein Signal, SPY in zehn Handelstagen +10 %: App Bargeld 100.000,00 $, Tagespunkt 100.000,00 $; Messung (Start und Rest in SPY) 110.000,00 $ = Massstab 110.000,00 $ - ...
K3  ZEIGT ABWEICHUNG: ... Messung kauft ZZZ (frueheste Annahmezeit), App kauft AAA (Reihenfolge in heute.offen: AAA,ZZZ = Schluesselfolge von drift_termine; ...)
K4  ZEIGT ABWEICHUNG: ... Messung kauft zur Eroeffnung 105,00, App zum Schluss 110,00 ...
K5  ZEIGT ABWEICHUNG: ... 11:00 New York: Messung Eroeffnung 21.10.2026, App Schluss 20.10.2026 ...
K6  ZEIGT ABWEICHUNG: ... Messung verkauft zur Eroeffnung am 30.12.2026 (60. Handelstag), App zum Schluss am 31.12.2026 (61. Handelstag ...); ohne Feiertage: Messung 60., App 63. ...
K7  ZEIGT ABWEICHUNG: ... 50-250 Messung 0,220 Pp, App 0,200 Pp; 250-1000 Messung 0,144 Pp, App 0,200 Pp; ab1000 Messung 0,091 Pp, App 0,200 Pp ...
K8  ZEIGT ABWEICHUNG: ... App eroeffnet einen Leerverkauf ueber 4.995,00 $ ... Messung: kein Handel (0 Kaeufe) ...
K9  ZEIGT ABWEICHUNG: ... Messung bucht am 06.03.2026 ... 0,00 $ (Totalverlust); App bucht am 12.03.2026 (5. Balken danach) 500,00 $ ...
K10 ZEIGT ABWEICHUNG: ... Kauf kostet 9,99 $ (2 x 10 Bp), Leerverkauf 0,01 $ ...
K11 ZEIGT ABWEICHUNG: ... AAA Messung Kauf 02.11.2026 zu 105,00, App 05.11.2026 zu 116,00 ...; OLD Messung Verkauf zu 50,00, App 05.11.2026 zu 45,00 ...
K12 ZEIGT ABWEICHUNG: ... Messung kauft am Einstiegstag (1 Kauf), App kauft nicht - "Signal ist 7 Handelstage alt (Grenze 5) ..."
K13 ZEIGT ABWEICHUNG: ... Messung laesst die Meldung verfallen ...; App ... kauft sie am 27.05.2026 ... zu 104,10 fuer 4.990,00 $ ...
K14 ZEIGT ABWEICHUNG: ... App laesst die faellige Position offen ..., bucht kein Reihenende (0) und zeigt sie zum Einstand: 10.010,00 $ ...
K15 kein Unterschied   K16 kein Unterschied   K17 kein Unterschied   K18 kein Unterschied   K19 kein Unterschied
```

Simulation mit virtuellem Kapital, keine Anlageberatung.
