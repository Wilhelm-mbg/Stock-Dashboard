# Übersicht: die drei Vorhaben vom 25.08.2026 nach der Skeptiker-Runde

**Stand:** 25.08.2026. Drei Entwürfe, je zwei Skeptiker (Linse *Vorgriff*, Linse
*Auflösung*), sechs Urteile. **Fünf von sechs lauten „hält nicht stand".**

**Ergebnis in einem Satz: von drei Vorhaben kann genau eines etwas entscheiden.**

| Rang | Vorhaben | Urteile | Ergebnis | Endfassung |
|---:|---|---|---|---|
| **1** | **Einstiegskonvention** | *Auflösung* hält stand, *Vorgriff* nicht | **VORREGISTRIERUNG**, mit sieben bindenden Änderungen | `studien/vorregistrierung-2026-08-25-einstiegskonvention/VORREGISTRIERUNG.md` |
| **2** | **Zustandshaken** | beide: hält nicht stand | **Architektur bauen, Wächter deklarieren.** Neue Fehlerart Z8 als eigentlicher Fund | `studien/entwuerfe-2026-08-25/ZUSTANDSHAKEN.md` |
| **3** | **Überlebensverzerrung** | beide: hält nicht stand, Auflösung reicht nicht | **NICHT MESSEN.** Zuerst Daten holen | `studien/vorregistrierung-2026-08-25-ueberlebensverzerrung/VORREGISTRIERUNG.md` |

Der Original-Entwurf des Zustandshakens liegt unverändert als
`zustandshaken-ENTWURF-original.md` daneben.

---

## Vorweg: die eine Sache, die heute etwas kostet

**Der live laufende `edgeZustand` (`depot.js` ~8306–8330) hat eine offene F1-Lücke.** Die
Driftschleife und die Signalschleife prüfen weder `c[i] > 0` noch `c[i+H] > 0` und haben
keine Obergrenze. Ein Fehldruck geht **ungefiltert** in `rohT` ein — also in die Größe, die
über die Handelspause entscheidet. Das ist kein Studienbefund, sondern ein Fehler im
produktiven Code, gefunden nebenbei beim Nachlesen für den Zustandshaken. **Vor allem
anderen flicken.**

---

## Rang 1 — Einstiegskonvention: die einzige, die etwas entscheidet

**Was sie entscheidet.** „Kostet der Einstieg zum Schluss der Signalkerze innerhalb der
Sitzung etwas?" Antwort mit **Faktor 15,6 Luft** gegen die Äquivalenzmarge: se 0,000285 Pp
auf 11,8 Mio. Fällen und 693 Tagen, Halbbreite 0,00064 Pp gegen eine Marge von 0,010 Pp.
Gegen die Kostenhürde von 0,10 Pp löst sie **114-mal** feiner auf. **Das ist die erste
Messung dieses Projekts mit echtem Spielraum statt Grenzlage** — und beide Skeptiker haben
die Zahlen unabhängig Ziffer für Ziffer reproduziert.

**Welche Einwände tödlich waren** (Linse *Vorgriff*, alle drei vor dem ersten Lauf
behebbar — und behoben):

1. **A9/A5 in der Zentrierung.** `lueckeBasis()` (Z. 737–753, heute nachgelesen) läuft über
   **beide** Hälften; die Kontrolle daneben trennt sie. Gemessen: Grenzbasis Entdeckung
   +0,07834 gegen Bestätigung +0,03519 Pp — eine Verschiebung von **0,043 Pp = 70× die MDE
   des Endpunkts**. Die `t1`-Korrektur fällt dadurch von −0,1197 auf −0,0993 Pp, und der
   Satz „die Korrektur ist größer als die MDE der Messung, die sie korrigiert" **fällt**.
2. **Der Riegel war kein Riegel.** `signalNutztSchlussKerzeI` sollte „mechanisch bestimmt"
   sein; die Maschine erzwang nur, dass das Feld **existiert**. Gesetzt hätte es jemand, der
   die Wirkrichtung je Strategie schon kannte (`t1` +0,12 Pp hoch, `quartalsschub` −0,19 Pp
   runter). B9 in Reinform, und der Entwurf verlangte, die Abschnitte unverändert
   einzufrieren.
3. **Der Placebo ist eine Teilmenge des Signals.** `winkelgrad` V0: 5.547.482 Signale gegen
   10.553.315 Kerzen → `schritt = 2` → rund 50 % Kontamination. Und die Werkzeugprobe machte
   „der Placebo liefert unter beiden Konventionen dasselbe" zur Sperre — ein **korrekt**
   gebauter Schalter hätte sie zum Scheitern gebracht.

**Was zu tun ist** — Reihenfolge steht in der Vorregistrierung, Kurzfassung:

1. **Basisvertrag** für `lueckeBasis()` (je Hälfte, je Zelle, ohne die Signalkerzen,
   gestutzt, im eigenen Universum) **mit Abbruch-Wachhund**. Vor allem anderen.
2. **Placebo aus dem Komplement**, `schritt == 1` wirft.
3. **`einstiegsZeitpunkt` per Instrumentierung ableiten** — dreiwertig
   (`schlusskerze` / `vortagsschluss` / `sitzungsintern`), Vertragsfeld wird **geprüft**,
   Abweichung ist Abbruch.
4. Erst dann die acht 60m-Strategien neu messen. **Nach unten: alles. Nach oben: nichts.**

**Was zusätzlich geändert wurde:** E2 (1d-Übernachtlücke) ist auf **beschreibend, kein
Urteil** herabgestuft — sie ändert nichts (keine 1d-Strategie liest `close[i]`) und läuft auf
einem Universum, dem 6.921 delistete Ticker fehlen, deren Reihen gar keinen Eröffnungskurs
haben. Testzahl fällt von 3 auf **2**, Schwelle von 2,394 auf **2,241**, und dieselbe
Schwelle gilt jetzt für Signifikanz **und** Äquivalenz (der Entwurf hatte hier eine
Asymmetrie zugunsten des erwarteten Ausgangs). E1 wird **je Zelle** geurteilt, weil die
Aggregatzahl −0,000054 Pp eine Auslöschung ist (P4 +0,00162 bei t 2,71 gegen P5 −0,00194 bei
t −4,09). Die `t1`-Schutzvorhersage wird als **Intervall** gegeben (t ≈ 1,6–3,1) und die
Ungültigkeit vom t-Wert **entkoppelt** — sie gilt, weil die Bestätigungshälfte verbraucht
ist, nicht weil die Schwelle ohnehin hält.

**Der wertvollste Fund dieses Vorhabens** steht bisher nirgends: **für die vielsignaligen
Detektoren hat die Maschine falsch gerechnet.** Basis aus der falschen Hälfte, und ein
Basistopf, der bei `winkelgrad` zu **52,6 %** aus dem Signal selbst besteht (entkontaminiert
Faktor **2,11**). Der Satz „Nicht: die Maschine hat bisher falsch gerechnet" ist gestrichen.

**Und was gerettet wurde:** Der Entwurf hatte den 60m-Grenzwert als „strukturell nicht
entscheidbar" abgeschrieben. Falsch: der Marktanteil der Varianz ist 60m 99,77 % gegen 1d
99,51 % — praktisch gleich. Der Unterschied sind die **Tage** (692 gegen 9.814). Es fehlen
**81 Handelstage** (≈ 4 Monate) für `|t| ≥ 2,394`. Die Frage ist wiedervorlagefähig, nicht
tot.

---

## Rang 2 — Zustandshaken: bauen ja, messen nein, und eine neue Fehlerart

**Die Empfehlung des Entwurfs war richtig. Seine Begründung war es nicht.**

**Welche Einwände tödlich waren:**

1. **Rückschau-Auswahl im Universum (Linse *Vorgriff*).** `POOLS_60M.volatil` ist eine
   Stichtagsliste vom **21.08.2026**, Auswahlkriterium „Vola über die letzten 120
   Handelstage" — das Fenster liegt **vollständig in der Bestätigungshälfte**. Auf 727 von
   730 simulierten Tagen lief dieser Pool nicht. Dieselbe Simulation liefert je nach
   Universum **1 / 2 / 4** abgeschlossene Episoden; der Entwurf hatte das extremste.
   **Auf dem tatsächlich bedienten Universum (default-60m, 99 Werte) liegen in der
   Entdeckungshälfte 69 Pausentage in zwei abgeschlossenen Episoden** — der Satz „es gab für
   diese Frage nie eine Entdeckungshälfte", mit dem der Entwurf den Blick auf die
   Bestätigung rechtfertigte, ist **widerlegt**. S4 wäre schätzbar gewesen.
2. **Der Haken kann den Wächter nicht ausdrücken (Linse *Auflösung*).** §9.2 speiste den
   Zustand nur aus **genommenen** Signalen; `depot.js` Z. 8320–8330 speist aus **allen**.
   Fällt die Speisung während der Pause weg, kann die Aufhebungsbedingung nie mehr feuern —
   **Dauerpause**. Keine der drei R1-Prüfungen fängt das; R1 hätte grün gemeldet.
3. **R2(iii) war zirkulär.** Das Tor, das entscheidet, ob die Bestätigungshälfte angefasst
   werden darf, war aus `werteB` berechnet — also erst **nach** dem Anfassen berechenbar.
   Die Regel hätte den Verstoß lizenziert, den sie verhindern soll.
4. **Die Kostenzeile war um zwei Größenordnungen zu günstig.** „+1,8 %" gilt für **einen**
   Durchgang; ein vollständiger Lauf mit 577 Permutations-Durchgängen kostet ≈ 33 min, also
   das **10,6-fache** — und nur, wenn die Signalberechnung zwischengespeichert wird.

**Was zu tun ist:**

1. **Haken bauen**, mit drei Korrekturen: **alle** Ergebnisse in den Freigabestapel (mit
   `genommen`-Flag), ein **`takt(Z, ms)`**-Rückruf, und ein Zeitstempel-Wächter, der im
   Produktivlauf überhaupt feuern **kann** (heute ist `maxAus < t` tautologisch).
2. **Vierte Prüfung „BEFREIUNG"** in R1: das Gatter muss pausieren **und wieder freigeben**.
   Sie hätte Mangel 2 gefangen.
3. **Fehlerart Z8** in `FEHLERTYPEN.md`: das Zustandsuniversum wurde mit Zukunftswissen
   gewählt. `universumHerkunft` mit Stichtag wird Pflicht, Vergleichslauf auf zwei
   nicht-rückschauenden Universen.
4. **Edge-Wächter deklarieren**, nicht messen — R3, jetzt ausdrücklich nur für den
   `rsi2seit`-Arm (der Kapitulations-Arm wurde nie simuliert).

**Was an Zahlen gestrichen wurde:** „nicht vor 2048" (die Rate ist 1,38 statt 0,69 je Jahr;
zentral ~11 Jahre, Band 4–40); „delta80 = 0,268 Pp" (es sind 0,268 ± ~0,05, auf dem falschen
Universum und einem Signalsatz ohne Abklingzeit); „4 Punktschätzer gesehen" (es waren über
20); „S4 ist tot" (S4 war schätzbar und ist **verfehlt**, 2 statt 8).

**Der schärfste Beleg gegen die Messung stand ungenutzt in den eigenen Zahlen:** für
`|t| ≥ 2,498` bräuchte es 0,2006 Pp; die **beste aller 214 Verschiebungen** des beobachteten
Episodenmusters erreicht **0,1830 Pp**. Kein Gatter dieser Form hätte die Schwelle erreicht
— **auch nicht mit perfektem Vorgriff.** Die positive Kontrolle des Entwurfs verdeckte das,
weil sie die 17 einzeln schlechtesten Tage sortiert — eine Form, die kein episodenförmiges
Gatter treffen kann. Daraus wird **SP2**: die positive Kontrolle muss dieselbe **Form**
haben wie das geprüfte Gatter.

---

## Rang 3 — Überlebensverzerrung: nicht messen, erst Daten holen

**Welche Einwände tödlich waren** (beide Skeptiker, unabhängig, mit fast identischen
Zahlen):

1. **Der A7-Endpunkt frisst die Frage auf.** Für eine Sonde, die auf jeder Kerze feuert, ist
   die Signalmenge **identisch mit dem Kontrolltopf**. Die 25 größten delisteten Absteiger
   (Median-Gesamtrendite −47,6 %) kommen als ROH −1,0627 Pp und **A7-Überschuss +0,0053 Pp**
   heraus. Das Urteil „Verzerrung belegt klein" wäre gefallen, ob die wahre Verzerrung 0 oder
   5 Pp beträgt.
2. **Der Placebo-Wächter macht „belegt" unerreichbar.** `schritt = max(1, round(verfuegbar/
   positionen))` wird für P1 breit exakt **1**; der Placebo hat dann **dieselbe Signalmenge**
   wie das Signal. Regel 1 wird zuerst geprüft → die Studie konnte nur `{ungültig, belegt
   klein, nicht entscheidbar}` liefern. **Der Wächter war der Endpunkt.**
3. **Vorgriff im Liquiditätsboden.** Der Boden rechnet über das ganze Fenster, inklusive des
   Volumensprungs am Übernahmetag. 26 Reihen werden dadurch **hereingeholt** (Median +62,1 %),
   13 **hinausgeworfen** (Median −63,9 %, 53,8 % unter −50 %). Der Filter lässt systematisch
   die Übernahmen herein und die Pleiten hinaus — und genau daran hing der „wichtigste
   Einzelbefund" des Entwurfs.
4. **S5 gerissen für die Sonde mit Inhalt.** P2 („rutsch", der 1d-Zwilling der Dip-Familie):
   delta80 **0,1353 / 0,1356 Pp** gemessen gegen behauptete 0,0534 — über der Hürde von
   0,10 Pp. Ursache nachgewiesen: die Planungsstreuung kam aus **zufälligem Ausdünnen** statt
   aus bedingter Auswahl (Faktor 2,70). **Die Sonde mit Auflösung hat keinen Inhalt, die
   Sonde mit Inhalt hat keine Auflösung.**
5. **Falsches Gewicht in jeder Pp-Zahl.** Gerechnet wurde mit w = 5,78 %; in der
   Bestätigungshälfte sind es **3,34–3,57 %**, in der Entdeckung 8,19 %. Da `B ∝ w`, hätte
   `|B|` für ein Hürden-Urteil **21,9 se** erreichen müssen. Der Ausgang stand vor dem
   ersten Lauf fest.

**Warum die Reparatur heute nicht reicht.** Der richtige Endpunkt (rohe bzw. gewichtsfreie
Kohortendifferenz) hat Auflösung **und** Inhalt — aber sein Punktschätzer wurde im Prüflauf
bereits auf der Bestätigungshälfte gerechnet und berichtet (**+0,0141 Pp, t = 4,26**), und
frische Bestätigungstage gibt es nicht: das delistete Archiv endet am 2026-08-21. Dazu:
nur **146 von 256** Reihen erreichen die Bestätigungshälfte mit gültiger Kontrolle
(ehrliche Abdeckung **2,1 %**, nicht 3,7 %), und die Linkstrunkierung macht jedes Ergebnis
zu einer Untergrenze **unbekannter Schärfe**.

**Was zu tun ist — das Datenprogramm:**

1. **Die 5.394 nie abgefragten delisteten Ticker holen**, mit **voller** Historie statt zwei
   Jahren. Heute fehlen sämtliche Delistings 2004–2023 — also die Dotcom-Nachwehen, 2008/09,
   der SPAC-Kater 2022/23, genau die Zeiträume, in denen Delisting Insolvenz hieß statt
   Übernahme. Quelle und Format sind dieselben; das ist Fleißarbeit, keine Forschung.
2. **Eröffnungskurs mitnehmen** (die vorhandenen 1.037 Dateien haben fünf Spalten).
3. **Abdeckungslücke je Kalenderjahr zählen** — die Korrektur ist selbst überlebensverzerrt,
   in dieselbe Richtung.
4. **Danach neu vorregistrieren**, mit Etikettentausch-Wächter statt Placebo, punkt-in-Zeit-
   Liquiditätsboden auf beide Arme, und **einer Gegenprobe auf einem Kunstarchiv mit
   eingebauter, bekannter Verzerrung**. Diese eine Gegenprobe hätte beide tödlichen Mängel
   vor dem ersten echten Lauf gefunden.

**Was trotzdem berichtet werden darf** (beschreibend, ohne Urteil): im Fenster 2024–2026
laufen **liquide** US-Werte vor ihrem Verschwinden **besser** als die Überlebenden, nicht
schlechter. Ein liquider Wert, der verschwindet, wird in der Regel übernommen. Die
Vorstellung „Delisting = Totalverlust" gilt für den illiquiden Schwanz — und den hat das
Kursarchiv nie enthalten.

---

## Ehrliche Einschätzung: was kann überhaupt etwas entscheiden?

**Genau eines: die Einstiegskonvention** — und auch die nur in ihrem Eichungszweig.

| Vorhaben | entscheidbar? | warum |
|---|---|---|
| **Einstiegskonvention E1/E3** | **Ja, mit großem Abstand** | Faktor 15,6 gegen die Marge, 114 gegen die Kostenhürde. Die bindende Schranke ist **nicht** die Auflösung, sondern die Konventionen der Maschine selbst — und die sind alle vor dem ersten Lauf reparierbar. |
| Einstiegskonvention, Zweig N | Nein, aber nützlich | Verbrauchte Bestätigungshälften. Die Neumessung darf nur **nach unten** wirken. Ihr Wert liegt darin, falsche Zahlen zurückzuziehen, nicht darin, richtige zu erzeugen. |
| Einstiegskonvention, 60m-Grenzwert | **Noch nicht — in ~4 Monaten** | 692 von 773 nötigen Tagen. Nur Tage helfen, Breite nicht. |
| Zustandshaken | **Nein**, und das ist gemessen | 2 statt 8 Entdeckungs- und 2 statt 15 Bestätigungs-Episoden; kein Gatter dieser Episodenform hätte die Schwelle je erreicht, auch nicht mit Vorgriff. Wiedervorlage Mitte der 2030er. |
| Überlebensverzerrung | **Nein** | Zwei von zwanzig Jahren, 2,1 % der Ticker, Endpunkt-Hälfte verbrannt, Auswahlfilter mit Zukunftswissen. Erst Daten, dann Frage. |

**Die Auflösungswand hat hier zweimal zugeschlagen und einmal nicht.** Zustandshaken und
Überlebensverzerrung reihen sich in die 34 von 38 strukturell blinden Messungen ein — der
Zustandshaken sogar mit dem seltenen Fall, dass die Blindheit **vor** der Messung bewiesen
werden konnte. Die Einstiegskonvention ist der Gegenfall: 11,8 Millionen Fälle auf 693
Tagen, und man misst nicht mehr Rauschen, sondern ausschließlich die eigenen Konventionen.

---

## Der rote Faden: die Wächter prüfen die Zeitachse, nicht die Auswahl

Alle drei Vorhaben sind an derselben Stelle gescheitert oder beinahe gescheitert, und es ist
**nicht** die Zeitachse. Der Fehlerkatalog ist gegen Vorgriff **in der Zeit** gut gerüstet
(A6, A7, A9, F2, C6, C7). Er hat keine Zeile gegen **Vorgriff in der Auswahl**:

| Vorhaben | die Auswahl, die Zukunftswissen benutzte |
|---|---|
| Überlebensverzerrung | der **Liquiditätsboden** über das ganze Fenster (→ B11) |
| Zustandshaken | das **Zustandsuniversum** aus einer Stichtagsliste (→ Z8) |
| Einstiegskonvention | `quartalsschub`s Universum `!!TERMINE[sym]` (189 Symbole aus dem heutigen App-Store) und `momentum`s Querschnittsrang über die 2026 noch vorhandenen Dateien |

Dazu zweimal derselbe Wächterfehler: **der Placebo ist nicht orthogonal zum Endpunkt**
(→ SP3 bei der Überlebensverzerrung, → 50 % Kontamination bei der Einstiegskonvention) —
beide Male, weil `schritt = max(1, round(verfuegbar/positionen))` bei vielsignaligen Sonden
gegen 1 läuft. **Eine Codezeile, zwei Studien.** Und einmal die Umkehrung: **die positive
Kontrolle hatte die falsche Form** (→ SP2).

Neue Katalogeinträge aus dieser Runde: **A5b, A10, B11, B12, B13, C8, SP2, SP3, Z8, Z9.**
Die teuersten davon sind **Z8** (rückschauend gewähltes Universum — es hat aus vier
Episoden eine gemacht) und **A10** (die Kontrolle absorbiert den Effekt, den die Studie
sucht — sie hat einen −47,6-%-Absturz in +0,005 Pp verwandelt).

---

## Reihenfolge der Arbeit

| | Was | Warum zuerst |
|---:|---|---|
| **0** | **F1-Lücke im live laufenden `edgeZustand` flicken** | kostet heute etwas |
| **1** | **Basisvertrag** für `lueckeBasis()` + Abbruch-Wachhund | Sperre für alles in Rang 1; die S9-Zeile ist heute für die zwei Strategien falsch, bei denen sie am meisten zu sagen hätte |
| **2** | **Placebo aus dem Komplement**, `schritt == 1` wirft | eine Zeile, zwei Studien |
| **3** | **Instrumentierte Ableitung** von `einstiegsZeitpunkt` | macht aus einem behaupteten Riegel einen echten |
| **4** | Zweig N neu messen — **nur nach unten** | erst wenn 1–3 stehen und die Werkzeugprobe besteht |
| **5** | **Zustandshaken bauen** (mit `takt`, `genommen`-Flag, BEFREIUNGS-Prüfung) | räumt eine Fehlerklasse ab; +1,8 % je Durchgang |
| **6** | Katalogeinträge A5b, A10, B11–B13, C8, SP2, SP3, Z8, Z9 | die Ausbeute des Tages |
| **7** | **Delistete Ticker nachholen** (5.394, volle Historie, mit Eröffnungskurs) | macht Rang 3 irgendwann messbar |

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
