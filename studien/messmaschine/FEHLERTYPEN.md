# Fehlertypen, gegen die die Messmaschine geprüft ist

Jeder Eintrag ist ein Fehler, der am 23.08.2026 in einer echten Messung dieses
Projekts vorgekommen ist — in Skripten des Autors, in Agentenarbeit oder in der
App selbst. Für jeden gibt es in `test-messmaschine.js` einen Testfall, der die
Maschine mit genau diesem Fehler füttert und prüft, dass sie ihn **erkennt oder
unmöglich macht**. Kein neuer Fehlertyp wird ohne Testfall aufgenommen.

Die Maschine ist nicht klug. Sie ist nur an diesen Stellen schon einmal gestolpert.

A9 und B9 stammen aus der unabhängigen Kontroll-Prüfung einer parallelen Sitzung
(`studien/kontrolle-2026-08/BEFUND.md`, Abschnitt 8). Vier ihrer sechs methodischen
Punkte deckte diese Liste bereits ab (A2, A3, C1, C2) — diese beiden nicht.

## A — Kontrolle

| # | Fehler | Vorkommen | Was die Maschine tut |
|---|---|---|---|
| A1 | Keine Kontrolle: Rohrendite als Kante gemeldet | +0,073 Pp „nach Spanne" ohne Vergleich; 62 % davon waren Halten | Kontrolle ist Pflichtbestandteil jeder Auswertung, kein Schalter |
| A2 | Kontrolle aus **einer** Zufallsziehung | Streuung 3,88 Pp statt 0,79; Maximum wanderte zwischen Läufen | Kontrolle ist die Erwartung über **alle** Kerzen desselben Symbols zur selben Stunde — deterministisch, kein Zufall |
| A3 | Kontrolle nicht gepaart: Listen verschieden sortiert, Paarung über Index | nur 0,6 % gleiches Symbol | Kontrolle wird **je Signal** aus dessen Symbol und Stunde nachgeschlagen, nie über Listenindex |
| A4 | Kontrolle liegt zeitlich **vor** dem Ereignis | Ersatzeinstieg zur Hälfte vor der Meldung, maß den Anlauf | Kontrolle nutzt nur die Tageszeit, nie einen Zeitpunkt relativ zum Signal |
| A5 | Kontrolle aus anderer Zeithälfte als das Signal | 50,5 % der Kontrollkerzen aus der jeweils anderen Hälfte | Kontrollerwartung wird **je Hälfte** getrennt gebildet |
| A6 | **Signal und Kontrolle schöpfen aus demselben endlichen Topf** | 23.08.: `t3-stundendrift` kam als „widerlegt" durch (t = −3,19 echt, −8,07 auf Zufallsdaten), obwohl nichts da war | **A7** — die Kontrolle lässt das Lesefenster des Signals aus. Danach t = +0,19 |
| A7 | Kontrolle enthält Kerzen, die das Signal gelesen hat | dieselbe Messung; Abhilfe zu A6 | Strategien geben `leseFensterKerzen` an; die Kontrolle mittelt über den Topf **ohne** `[i − Fenster, i + H − 1]`. Ohne Angabe: Warnung im Protokoll, kein stillschweigendes Null |
| A8 | Aus einem Nullarchiv auf **Signifikanz** schließen | 23.08.: `t1` kam dort mit t = 2,97 als „bestätigt" durch — bei einem Punktschätzer, der dem echten glich (+0,0946 gegen +0,0933). Nur der Standardfehler brach ein, von 0,0707 auf 0,0319 | Der Nullversuch würfelt jedes Symbol **einzeln** und zerstört den Gleichlauf der Werte. Er misst Verzerrung, **nie** Signifikanz — steht als Warnung in jeder erzeugten Datei |
| A9 | Kontrolle beginnt früher, als der Detektor rechnen darf | Kontroll-Prüfung 23.08.: Start bei Kerze 60 statt 261 verschob den Intraday-Überschuss von +0,064 auf **+0,036** — 44 % des Werts | `baueKontrolle` läuft ab demselben `vorlauf` wie die Signalschleife (261). Kerzen, an denen das Signal nicht rechnen darf, sind auch keine Vergleichsfälle |

**Warum A6 schwerer wiegt als alles davor.** Die Kontrolle ist der Mittelwert des
Symbols zu dieser Stunde über die ganze Hälfte — ein **endlicher** Topf von rund 366
Werten. Jedes Signal, das seine Auswahl aus demselben Topf speist, verschiebt den
Rest, und zwar ohne dass im Markt irgendetwas passiert:

- **T3** wählt Kerzen, deren vorige 60 Vorkommen hoch lagen. Liegt die Summe des
  Topfes fest, müssen die übrigen tiefer liegen — und aus denen wird gezogen. **Sog
  nach unten.**
- **T1** wurde hier ursprünglich als zweites Beispiel geführt („Sog nach oben"). **Das war
  falsch.** Der Punktschätzer auf dem Zufallsarchiv (+0,0946 Pp) glich dem echten
  (+0,0933 Pp); das Fehlurteil kam vom eingebrochenen Standardfehler, nicht von einer
  Verzerrung — siehe A8. Vergrößert man T1s Lesefenster von 430 auf 4.000 Kerzen,
  schrumpft sein Null-Überschuss **nicht** (0,059 → 0,045 → 0,048 → 0,051 → 0,063).
  Bei einer Überlappungsverzerrung müsste er das.

Dieselbe Ursache, entgegengesetztes Vorzeichen — je nach Bauart des Signals. Man
kann sie deshalb nicht einmal ausrechnen und pauschal abziehen. Sie muss je
Strategie gemessen werden.

**Der Nullversuch erfindet keine Kurse.** Wilhelm hatte früher zu Recht eingewandt,
dass ausgedachte Kurse nie aussehen wie echte. Es sind seine Renditen, jede einzelne,
mit ihren echten Ausreißern und ihrer echten Streuung. Vertauscht wird nur die
**Reihenfolge**, getrennt innerhalb jeder UTC-Stunde — der Stundenmittelwert und
damit die Kontrolle bleiben gleich bis auf die fünfte Nachkommastelle.

**Und die Grenze des Werkzeugs:** Das Vertauschen zerstört die
Volatilitäts-Cluster. Für ein Signal, das gerade geclusterte Tage auswählt, hat der
Nullversuch damit zu **wenig** Streuung. Er taugt zur Messung der Verzerrung, nicht
als Standardfehler. Deshalb gilt der **größere** aus beiden.

**Der Beweis für A6** ist nicht der Nullversuch, sondern eine Manipulation der
behaupteten Ursache mit vorhergesagtem Ausgang: Schrumpft der Kontrolltopf von 366
auf 183 auf 103 Werte, wächst die Verzerrung um Faktor **1,84** und **2,81** —
vorhergesagt waren 1,87 und 2,9. Vier unabhängige geschlossene Rechnungen treffen
sie zusätzlich auf 1–4 %. Und die schärfste Placebo-Probe: derselbe Detektor, am Topf
der **Vorstunde** gemessen, ergibt −0,0005 statt −0,0242 Pp.

**Warum A7 besser ist als Nachmessen.** Die erste Abhilfe war, die Verzerrung mit 30
Nullversuchen je Strategie zu schätzen und abzuziehen. Das schätzt, wo man rechnen
kann: A7 macht den Erwartungswert des Überschusses unter der Nullhypothese **exakt**
null, in einem Durchlauf, ohne Zufall. Der Nullversuch bleibt als Gegenprobe — er hat
A6 gefunden und weist nach, dass A7 wirkt (t3 auf Zufallsdaten: −8,07 → +0,55).

**Was der Verzerrungsabzug angerichtet hätte.** Bei `rsi2seit` schätzte er +0,027 Pp
Verzerrung; A7 zeigt, dass dort praktisch keine ist (+0,0241 roh gegen +0,0277 mit
A7). Der Abzug hätte den Wert auf −0,003 gedrückt und die Aussage „der ganze
Überschuss war das Messgerät" gestützt — die damit **falsch** war. Ein
Verzerrungsschätzer mit eigenem Fehler ist selbst eine Fehlerquelle.

**Warum es die Gruppe F erst seit dem 25.08.2026 gibt.** Die Frage „stimmen die
Daten überhaupt?" wurde bis dahin mit sieben Prüfungen beantwortet: doppelte und
rückwärts laufende Zeitstempel, Wochenendkerzen, dreielementige Kerzen, Kurse ≤ 0,
Hoch unter Tief, CFD-Markierungen. **Alle sieben standen auf null** — und trotzdem
lag im Archiv ein Wert mit 4,2 Milliarden Dollar je Aktie.

Keine der Prüfungen fragte nach **Plausibilität**. Sie prüften die Form der Daten,
nicht ihren Inhalt. Das ist die allgemeine Lehre: Eine Prüfliste, die nur bestätigt,
was man ohnehin vermutet hat, findet nichts Neues.

Gefunden wurde es durch den Placebo-Lauf — ein Signal, dessen richtige Antwort man
vorher kennt. **Das ist die wirksamste Prüfung, die es für ein Messgerät gibt**, und
sie läuft seitdem bei jeder Messung mit.

## B — Statistik

| # | Fehler | Vorkommen | Was die Maschine tut |
|---|---|---|---|
| B1 | t über Einzelsignale statt über Tage | bläht t um Faktor 2–3 auf | t wird **nur** über Tagesmittel gerechnet; ein Signal-t gibt es nicht |
| B2 | Tagesmittel gleichgewichtet als „Erwartung je Handel" gelesen | +0,066 (Tage) vs. +0,0115 (je Signal); 4 von 5 Zeilen kippten das Vorzeichen | Beide Zahlen werden ausgewiesen und **benannt**: „Teststatistik (Tage)" und „Erwartung je Handel (Signale)" |
| B3 | MDE fehlt → „kein Effekt" statt „nicht entscheidbar" | „traegt" ohne Test in neue-lage.js | MDE steht **vor** dem Urteil; unter MDE ist das Urteil immer „nicht entscheidbar" |
| B4 | Zahl der Tests nicht ausgewiesen | 60 Kombinationen gemeldet, ≥370 gerechnet | Jeder Aufruf der Maschine zählt hoch; Bonferroni wird auf die **tatsächliche** Zahl gerechnet und ausgewiesen |
| B5 | Entdeckung und Bestätigung auf denselben Tagen | schutz-messen.js behauptete Trennung, hatte keine | Der Schnitt ist Teil der Signatur; ohne Bestätigungszeitraum kein Urteil |
| B6 | Bonferroni auf das volle t statt auf die Bestätigung | „verfehlt |t| > 3,34 (t = 2,29)" auf voller Achse, Bestätigung hatte t = 1,40 | Schwelle wird auf den **Bestätigungs**-t angewandt |
| B7 | Nachträgliches Weglassen von Fällen, das das Ergebnis macht | „ohne die zwei Crash-Tage +0,40" | Teilmengen nur, wenn sie in der Vorregistrierung stehen; sonst verweigert |
| B8 | Testfamilie über Dateien hinweg nicht gezählt | 23.08.: sieben vorregistrierte Thesen auf drei Dateien verteilt ergaben dreimal die Schwelle für zwei Tests statt einmal die für sieben | Strategien geben `testfamilie.testsGesamt` an; B4 rechnet damit. Die Zahl wirkt nur nach oben |
| B9 | **Rasterlage als verschwiegener Mehrfachtest** | Kontroll-Prüfung 23.08.: Beim Momentum erreicht von **63 möglichen Lagen** des 63-Tage-Rasters **keine** ein t ≥ 1,96 (Median 1,15) — die gewählte saß am günstigen Rand | Jede willkürliche Phase, Rasterlage oder Startverschiebung ist ein Test. Sie gehört in `testfamilie.testsGesamt`, sonst rechnet B4 mit einer zu niedrigen Schwelle |
| B10 | **Überlappende Halteperioden als unabhängige Tage gezählt** | 24.08.: Momentum mit 63 Tagen Haltedauer und einem Signal je Tag — t naiv **4,74**, Newey-West **0,74**, nicht überlappende Blöcke Median **0,52** (0 von 63 Lagen über der Schwelle) | Der Standardfehler ist immer Newey-West-korrigiert mit **H−1** Verzögerungen (Bartlett-Gewichte). Bei H = 1 ändert das nichts; der Faktor steht im Protokoll |

**Warum B9 so leicht zu übersehen ist.** Wer ein Momentum über 63 Handelstage rechnet,
muss irgendwo anfangen — und jeder Starttag ergibt eine andere Zerlegung derselben
Kursreihe. Das sieht nach einer Einstellung aus, ist aber eine Auswahl unter 63
gleichberechtigten Möglichkeiten. Wer eine davon berichtet, hat 63 Tests gemacht und
62 verschwiegen. Dasselbe gilt für Monats-, Quartals- und Wochenraster, für den
Startpunkt gleitender Fenster und für jede „ab welcher Kerze zählen wir"-Entscheidung.

Die Gegenprobe ist billig und sollte zur Pflicht gehören: **alle Lagen rechnen und die
Verteilung berichten.** Liegt die gewählte Lage am Rand, ist das kein Detail, sondern
der Befund.

**Warum B10 so lange unbemerkt blieb.** Die Maschine clustert über Handelstage —
genau richtig gegen den Fehler, Signale desselben Tages als unabhängig zu zählen
(B1). Der zweite Schritt fehlte: Bei einer Haltedauer von H Kerzen teilen
aufeinanderfolgende **Tage** H−1 Kerzen ihres Ergebnisfensters. Sie sind dann
ebenso wenig unabhängig wie Signale innerhalb eines Tages.

Die Autokorrelation der Tagesmittel zeigt es unmissverständlich — sie fällt exakt
bei der Haltedauer ab:

| Verzögerung | 1 | 5 | 21 | 63 | 126 |
|---|---|---|---|---|---|
| Autokorrelation | 0,979 | 0,902 | 0,646 | **0,016** | 0,082 |

Betroffen ist **jede** Messung mit H > 1. Nachgerechnet nach dem Einbau:

| Messung | H | t vorher | t nachher |
|---|---|---|---|
| Momentum, stärkste 10 % | 63 | 4,74 | **0,74** |
| Kapitulations-Dip V0 | 26 | 2,59 | **1,74** |

Beide „Befunde" des 24.08. lösen sich damit auf. Das ist nach A6 die zweitschwerste
Korrektur an dieser Maschine — und wie bei A6 gilt: Sie kam nicht aus einer Ahnung,
sondern aus der Frage „warum ist dieser t-Wert so groß?"

## C — Einheiten und Zeit

| # | Fehler | Vorkommen | Was die Maschine tut |
|---|---|---|---|
| C1 | Haltedauer in Wanduhrzeit statt Kerzen | 480 Min über Nacht = 1 Kerze statt 8 | Haltedauer ist **immer** eine Kerzenzahl; Minuten werden nicht akzeptiert |
| C2 | Nächte als Handelstagswechsel statt Kalendernächte | Faktor 1,45 in ausgeliefertem Code | Nächte werden aus Zeitstempeln gezählt (Kalendertage) |
| C3 | Doppelte Prozentumrechnung | 54,4 % → „5.444 %" | Alle Renditen intern als Anteil; Prozent nur in der Ausgabe, einmal |
| C4 | Handelstage als Kalendertage | 252/365-Näherung | Handelstage werden aus der Achse gezählt |
| C5 | Kosten doppelt abgezogen | Netto-Spalte nochmal um Hürde gemindert | Kosten werden **einmal** an **einer** Stelle abgezogen; Brutto und Netto sind getrennte Felder |
| C6 | Vorgriff innerhalb der Kerze | MCP-Stop 23.08.: Hoch aus derselben Kerze, gegen deren Tief geprüft wurde; t = 15,74 | Eine Ausstiegsregel bekommt **nur abgeschlossene** Kerzen und liefert **nur ein Niveau**; die Maschine wendet es auf die **nächste** Kerze an |
| C7 | Wunsch-Ausführung | 23.08.: Füllung zum Stopkurs auch bei Eröffnung darunter; t 5,96 → −0,75 nach Korrektur | Die Maschine füllt zum **schlechteren** aus Stop und erstem handelbaren Kurs — seit 24.08. dem **echten Eröffnungskurs**, wo das Archiv ihn führt (`eroeffnungKurs`). Sonst der Vorkerzen-Schluss, und das steht als Warnung im Protokoll |

**Woher C6 und C7 stammen:** Am 23.08.2026 wurde der Ausstieg aus dem TradingView-Skript
„MCP Stop Strategy [JARUTIR]" geprüft — außerhalb dieser Maschine, weil sie damals nur
Einstiege mit fester Haltedauer kannte. Genau dort passierten beide Fehler:

| Fassung | je Signal | t |
|---|---|---|
| erster Wurf (Hoch und Tief derselben Kerze) | +0,400 Pp | 15,74 |
| ohne Vorgriff, aber Füllung zum Wunschkurs | +0,189 Pp | 5,96 |
| mit ehrlicher Füllung | −0,023 Pp | −0,75 |

Der gesamte scheinbare Nutzen war die Annahme, man hätte den Höchstkurs abgepasst und
werde bei jeder Lücke trotzdem zum Wunschkurs bedient. Seit dem Ausbau kann eine
Ausstiegsregel das nicht mehr — nicht weil sie es lassen soll, sondern weil sie die
dafür nötigen Daten nie zu sehen bekommt. Die Kontrolle bekommt denselben Ausstieg;
sonst misst man den Stop statt das Signal.

**Was der fehlende Eröffnungskurs kostete.** Bis zum 24.08.2026 führte das Archiv
je Kerze nur `[Zeit, Schluss, Umsatz, Hoch, Tief]`. Ohne Eröffnungskurs musste der
Schluss der **Vorkerze** als erster handelbarer Kurs dienen — bei einer
Übernachtlücke genau der Kurs, den es nicht mehr gibt. Gemessen an 40 Werten:
**14,3 %** aller Kerzen folgen auf eine Lücke, **40,6 %** dieser Lücken springen über
1 %. In rund 5,8 % aller Kerzen war die Näherung also spürbar falsch — und zwar dort,
wo Stops greifen.

Der Testfall dazu baut zwei Archive mit identischen Schluss-, Hoch- und Tiefkursen,
eines mit Eröffnungskursen und eines ohne, und lässt dieselbe Stop-Regel darauf
laufen: **−0,2695 Pp gegen −0,0990 Pp**. Die Näherung war um Faktor 2,7 zu günstig,
und zwar systematisch in dieselbe Richtung — Lücken bei einem Long-Signal öffnen
häufiger nach unten.

Yahoo liefert den Eröffnungskurs; die App verwarf ihn. Seit `tools/yahoo-60m-holen.js`
steht er als **sechstes Element** in der Kerze. Die ersten fünf bleiben unverändert.

## D — Gemessenes Objekt ≠ implementiertes Objekt

| # | Fehler | Vorkommen | Was die Maschine tut |
|---|---|---|---|
| D1 | Filter im Skript anders als in der App | Umsatz der Signalkerze ×6,5 statt Tagesmittel; t −1,61 → −0,20 | Filter kommen aus **quant.js/depot.js**, nicht aus Nachbildungen; wo nicht möglich, steht „Nachbildung" im Protokoll |
| D2 | Drei Werte für dieselbe Kante in Umlauf | 0,11 / 0,147 / 0,170 | Das Protokoll ist die **einzige** Quelle; die App liest es, rechnet nichts selbst |
| D3 | Konfiguration stillschweigend gewechselt | `instrument:'schein'` mit Kommentar „Voreinstellung" (war `basis`) | Konfiguration steht vollständig im Protokoll; Abweichung von der App-Voreinstellung wird ausgewiesen |
| D4 | Feste Annahmen, die das Ergebnis tragen | Basiswert 200 $, Vola 0,30 fest verdrahtet; Hürde schwankt Faktor 2 | Annahmen stehen als Felder im Protokoll, nicht als Konstanten im Code |
| D5 | Zeitzone: Datum ohne Uhrzeit als „vor Börsenschluss" | 59,8 % der Termine; 14,07 → 8,44 % p.a. | Termine ohne Uhrzeit gelten als **nach** Schluss (konservativ) und werden gezählt |

## E — Reichweite

| # | Fehler | Vorkommen | Was die Maschine tut |
|---|---|---|---|
| E1 | Überlebensverzerrung nicht benannt | in keiner Schutzmechanismus-Messung erwähnt | Pflichtfeld: Universum-Herkunft und Stichtag der Auswahl |
| E2 | Von 10 Werten auf 191 verallgemeinert | Stabilitätsaussage der Kanalerkennung | Zahl der Werte und Signale steht in jeder Aussage |
| E3 | Behauptung ohne Skript | „17 Jahre" aus falsch gewichteter Aussicht | Jede Zahl im Protokoll trägt den Namen der Funktion, die sie erzeugt hat |

## F — Die Daten selbst

Bis zum 25.08.2026 gab es diese Gruppe nicht. Alle Prüfungen davor fragten, ob
*gerechnet* wird wie behauptet — keine fragte, ob die Zahlen, mit denen gerechnet
wird, überhaupt möglich sind.

| # | Fehler | Vorkommen | Was die Maschine tut |
|---|---|---|---|
| F1 | **Fehldrucke im Kontrolltopf** | 25.08.: 1.696 von 6,5 Mio. Kontrollkerzen über 50 Pp. `DFEN` 0,27 → 28,73 = **+10.541 Pp** (nicht bereinigte Zusammenlegung), `WHLR` mit **4.169.491.200 $** je Aktie, `ZVZZT` (NASDAQ-Testsymbol) 10 → 260. Ein Placebo ohne jeden Kursbezug lieferte dadurch **−0,1722 Pp statt null** | Reihen mit Sprüngen über +400 %/−80 % oder Kursen über 100.000 $ werden **ganz** verworfen und im Protokoll benannt; die Kontrolle ist zusätzlich an den 1-%-Quantilen jedes Topfes gestutzt |
| F2 | A7-Ausschnitt endet H Kerzen zu früh | dieselbe Prüfung. Eine Kontrollkerze bei `j` trägt die Rendite über `(j, j+H]` und berührt das Lesefenster schon ab `j = i−Fenster−H`. Kunstarchiv mit wahrem Wert null: **+0,048 statt +0,024 Pp** | Der Ausschnitt beginnt bei `i − Fenster − H` |
| F3 | **UTC-Stunde statt Sitzungsposition** | dieselbe Prüfung. Die US-Sitzung wandert mit der Zeitumstellung: „Stunde 19" ist im Sommer die Schlusskerze (Folge = über Nacht, +0,0805 Pp, sd 2,122) und im Winter eine Kerze mitten am Tag (−0,0042 Pp, sd 0,559) | Der Topf-Schlüssel ist die **Position in der Sitzung** (0 = erste Kerze des Tages), durchgezählt statt aus der Uhrzeit abgeleitet |
| F4 | Signale fallen still aus der Messung | dieselbe Prüfung: bis zu **10,3 %** einer Messung konnten ohne Kontrolle verschwinden, ohne dass Konsole oder Warnliste es sagten | Anteil steht im Protokoll; über 2 % gibt es eine Warnung |
| SP | **Der Nullpunkt wird nicht geprüft** | der Fehler, der F1 zwei Tage lang verdeckt hat | Jede Messung fährt einen **Placebo-Lauf** mit: ein Signal ohne jeden Kursbezug auf denselben Sitzungspositionen. Sein wahrer Überschuss ist null. Übersteigt das Ergebnis die eigene Auflösung, wird das Urteil als *bestätigt-aber-nullpunkt-verschoben* gekennzeichnet |
