# REGEL — Auftrag Nr. 89R-2: die drei Auslöser aus dem Reel und seine Ausstiegsstruktur (QQQ, SPY, IWM)

Festgelegt vom PM am 04.10.2026, **bevor es eine Zahl gibt**. Teil A ist §2 des Auftrags
(`uebergabe/auftrag-reel-strategien-teil2-2026-10-04.md`) wörtlich. Teil B sind die Lesarten des Studien-Chats — festgehalten vor dem
ersten Lauf, zusammen mit Code und Tests im Siegel-Commit. Teil C ist, was vor dem Siegel festgestellt wurde (nur an Kunstdaten; vor dem
Siegel wurde keine Archivdatei gelesen).

Bausteine aus Teil 1 (`studien/reel-vwap-ema-2026-10-04/daten.js` und `kern.js`) werden per `require` benutzt und nicht geändert;
ihre Lesarten L1–L19 (`studien/reel-vwap-ema-2026-10-04/REGEL.md`) gelten, wo diese Studie sie benutzt.

## A. Die Regeln (§2 des Auftrags, wörtlich)

## 2. Die Regeln (vom PM festgelegt, bevor es eine Zahl gibt — nicht ändern; was nicht geht, melden statt anpassen)

**2.1 Größen.** VWAP des Tages und EMA 9/21/50 wie in Teil 1 (§2.1, §2.3 dort; EMAs fortlaufend über alle regulären Kerzen des Archivs,
die ersten 250 Kerzen ohne Signal). **ATR** = Mittel der wahren Spanne (größter Wert aus Hoch − Tief, |Hoch − Schluss der Vorkerze|,
|Tief − Schluss der Vorkerze|; „Vorkerze" = vorige reguläre Kerze, auch über die Nacht) der letzten 14 regulären Kerzen einschließlich der
aktuellen (einfaches Mittel, fortlaufend über die Tage; die ersten 250 Kerzen des Archivs ohne Signal). „Seite" und „gleich" wie in Teil 1
(Lesart L2 dort: gleich, wenn der Unterschied höchstens 10⁻⁹ des Kurses beträgt; ein Gleichstand hält die bisherige Seite).

**2.2 Die Auslöser** (je Wert, ausgewertet nach dem Schluss jeder regulären Kerze t; die letzte Kerze des Tages löst nichts aus):
- **A1 VWAP-Kreuz:** der Kerzenschluss wechselt innerhalb eines Tages die Seite des Tages-VWAP — **genau das „Ereignis R1" aus Teil 1**
  (Funktion `ereignisse` mit dem Zustand R1 und Lesart L12 von dort; die erste Kerze des Tages ist kein Ereignis). Nach oben → Call, nach
  unten → Put.
- **A1f VWAP-Kreuz mit Filter:** A1, aber **nicht**, wenn |EMA9(t) − EMA21(t)| < 0,5 × ATR(t) („zusammengedrückt"). *Die Schwelle 0,5 ist
  eine Annahme des PM — das Reel nennt keine Zahl.*
- **A2 EMA-50-Kreuz:** die Seite des Schlusskurses gegenüber der EMA 50 derselben Kerze wechselt gegenüber der Vorkerze (Vorkerze = vorige
  reguläre Kerze, auch über die Nacht — eine Eröffnungslücke über die EMA löst also an der ersten Kerze des Tages aus; ein Gleichstand hält
  die bisherige Seite). Nach oben → Call, nach unten → Put.
- **A3 Ausbruch aus den ersten 15 Minuten:** Spanne = höchstes Hoch und tiefstes Tief der regulären Kerzen der ersten 15 Minuten des Tages
  (09:30 bis 09:44 Ortszeit New York; über die Tagesminute bestimmen, nicht über die Zahl der Kerzen). Ab der Kerze 09:45: der **erste**
  Kerzenschluss über dem Hoch → Call, der erste unter dem Tief → Put; je Tag und Seite höchstens ein Auslöser.
- **„Alle"** = A1f, A2 und A3 zusammen (so beschreibt der Autor seinen Bot). Fallen zwei Auslöser derselben Richtung auf dieselbe Kerze,
  zählt das Ereignis einmal; widersprechen sie sich, entfällt es.

**2.3 Ereignis-Sicht (Frage 1).** Je Ereignis der Ertrag in Signalrichtung von der Eröffnung der nächsten vorhandenen regulären Kerze bis
zur Eröffnung der Kerze H Minuten später, H = 1, 2, 3, 5, 10, 15 (reicht der Tag nicht, entfällt das Ereignis für dieses H). Kontrolle wie
Teil 1 §2.8: abgezogen wird der mittlere Ertrag desselben Werts über dieselbe Tagesminute und dasselbe H im selben Kalenderjahr, mit
demselben Vorzeichen. Je Wert × Auslöser (A1, A1f, A2, A3, Alle) × Fenster × H: Zahl der Ereignisse, Mittel in Basispunkten,
Standardfehler über Tage gebündelt, t.
**Hauptzelle: QQQ, „Alle", H = 5, W-Nach.** Geschätzte Hürde: **1,0 Basispunkte** je Trade hin und zurück (Spanne 2 Cent und Kommission
1,3 Cent je Optionsanteil bei Delta 0,5 und einem Kurs um 750 $; Schätzung des PM, nicht gemessen).
**Satz (vorher festgelegt):** „**Richtungsvorteil über der geschätzten Hürde**", wenn Mittel ≥ 1,0 Basispunkte und t ≥ 2; „**Richtungsvorteil
vorhanden, aber unter der geschätzten Hürde**", wenn t ≥ 2 und 0 < Mittel < 1,0; sonst „**kein Richtungsvorteil**". Die übrigen Zellen
stehen nachrichtlich daneben (im Urteilsfenster 3 Werte × 5 Auslöser × 6 H = 90 Zellen; dazu sagen, wie viele |t| ≥ 2 haben und welche
Schwelle für 90 Zellen gälte).

**2.4 Struktur-Sicht (Frage 2): ein Bot je Wert.** Einstiege aus „Alle" (A1f, A2, A3). Nach einem Auslöser auf Kerze t wird zur Eröffnung
der nächsten vorhandenen Kerze eingestiegen, wenn (a) keine Position offen ist, (b) seit dem letzten Ausstieg mindestens 5 Minuten
vergangen sind (*Annahme des PM für „waits a moment"*; gemessen vom Beginn der Kerze, in der ausgestiegen wurde, bis zum Beginn der
Einstiegskerze), (c) die Tagesbremse nicht gezogen ist, (d) die Kerze, zu deren Eröffnung eingestiegen würde, spätestens um 15:44 beginnt.
Auslöser, die eine dieser Bedingungen nicht erfüllen, verfallen (kein Nachholen). Eine Position je Bot. Am Schluss der letzten regulären Kerze wird glattgestellt.

**2.5 Ausstiege** (geprüft Kerze für Kerze ab der Einstiegskerze; innerhalb einer Kerze gilt **der ungünstige Fall zuerst**: erreicht eine
Kerze Stopp und Gewinnmarke, zählt der Stopp):
- **Stopp:** der Optionswert fällt um **17 %** der Prämie (20 Optionen × 100 Anteile × 3,69 $ × 17 % ≈ 1.250 $ — das „Risiko je Trade"
  aus der Einblendung; *Annahme: der Autor sagt nur „based on ATR"*). Verlust = −1 R.
- **Gewinnsicherung:** sobald der Optionsgewinn **+6 %** der Prämie erreicht hat, ist die Sicherung scharf; verkauft wird, sobald der
  Gewinn auf **60 % seines bisherigen Höchststands** zurückfällt (40 % abgegeben). Der Höchststand steigt mit jedem neuen günstigeren Kurs
  weiter (er wird nie kleiner).
- **Tagesende:** Schlusskurs der letzten Kerze.
- **Genau so, Kerze für Kerze** (g(p) = Kursbewegung in Signalrichtung seit dem Einstiegskurs; „günstig" = Hoch beim Call, Tief beim Put;
  „ungünstig" = Tief beim Call, Hoch beim Put; M = Höchststand von g, zu Beginn 0; alle Schwellen in Kursbewegung nach §2.6):
  1. **Stopp:** liegt g(ungünstig) bei oder unter −0,1666 %, Ausstieg zum Stoppkurs — liegt schon die Eröffnung der Kerze dahinter, zur
     Eröffnung. Fertig.
  2. **Rückfall gegen den alten Höchststand:** war die Sicherung schon **vor** dieser Kerze scharf (M ≥ +0,0588 %) und liegt g(ungünstig)
     bei oder unter 0,6 × M, Ausstieg zum Kurs der Marke 0,6 × M — liegt schon die Eröffnung darunter, zur Eröffnung. Fertig.
  3. **Höchststand nachziehen:** M = größerer Wert aus M und g(günstig).
  4. **Rückfall in derselben Kerze:** hat Schritt 3 den Höchststand erhöht, ist die Sicherung jetzt scharf und liegt g(Schluss) bei oder
     unter 0,6 × M, Ausstieg zum Kurs der Marke 0,6 × M (der Kurs hat sie auf dem Weg vom Hoch zum Schluss durchlaufen). Sonst läuft die
     Position weiter.
  5. Ist es die letzte Kerze des Tages und die Position noch offen: Ausstieg zum Schluss.
  Die Schritte gelten auch für die Einstiegskerze (Einstieg zu ihrer Eröffnung).

**2.6 Die Option, genähert über den Basiswert (Annahmen, alle so benennen).** Prämie = **0,49 %** des Kurses beim Einstieg (3,69 $ bei
751 $). Optionsgewinn je Anteil = **0,5 ×** Kursbewegung des Basiswerts in Signalrichtung (Delta 0,5, kein Gamma, kein Zeitwertverlust).
Kosten = **1,0 %** der Prämie je Trade hin und zurück. In Kursbewegung heißt das: Gewinnsicherung scharf ab +0,0588 % in Signalrichtung,
Stopp bei −0,1666 % dagegen, Kosten 0,0098 %. **Einheit R** = 17 % der Prämie (der Stopp). Gerechnet wird in R je Trade; ein Bot handelt
immer 1 R Risiko, keine Zinseszinsen.

**2.7 Tagesbremse.** Hat der Bot an einem Tag realisiert **+1,44 R** oder mehr (1.800 $ / 1.250 $), nimmt er an diesem Tag keinen neuen
Einstieg mehr (eine offene Position läuft nach ihren Regeln aus). **Keine Verlustbremse.**

**2.8 Zufalls-Kontrollen (je 200 Wiederholungen, fester Startwert, je Wert und Fenster).**
- **Z1 „Zufallsrichtung":** dieselben Auslöser-Zeitpunkte wie der Bot, aber die Richtung wird je Einstieg gewürfelt; sonst alles gleich
  (Abkühlzeit, Bremse, Ausstiege).
- **Z2 „Zufallszeit":** an jeder Kerze zwischen 09:45 und 15:44 entsteht mit fester Wahrscheinlichkeit ein Auslöser mit gewürfelter
  Richtung; die Wahrscheinlichkeit ist so gesetzt, dass je Wert und Fenster im Mittel so viele **Auslöser je Tag** entstehen wie bei
  „Alle"; sonst alles gleich.

**2.9 Kennzahlen der Struktur-Sicht** (je Wert, Fenster; für Bot, Z1, Z2 — bei den Kontrollen Median und 2,5-/97,5-%-Stelle über die 200
Wiederholungen): Trades, Trades je Tag, Trefferquote, mittlerer Gewinn und mittlerer Verlust in R, **Ertrag je Trade in R** (Standardfehler
über Tage gebündelt, t), Ertrag je Tag in R, **Anteil grüner Tage** (Tage mit Ertrag > 0 unter den **Handelstagen mit mindestens einem
Trade** — nur diese Tage zählen im Folgenden, Tage ohne Trade werden übersprungen und unterbrechen nichts), längste Serie grüner Tage
(aufeinanderfolgende Tage mit Trade, alle mit Ertrag > 0), **Anteil der 23-Tage-Blöcke** (die Tage mit Trade eines Fensters der Reihe nach
in nicht überlappende Blöcke zu je 23 geteilt, ein unvollständiger letzter Block entfällt), in denen alle 23 Tage grün sind, schlechtester
und bester Tag in R, Summe in R, größter Rückschlag der R-Kurve; Kalenderjahre.
**Sätze (vorher festgelegt), für QQQ im Fenster W-Nach:** „**Die Auslöser tragen etwas bei**", wenn der Ertrag je Trade des Bots über der
97,5-%-Stelle von Z1 liegt; sonst „**Die Auslöser tragen gegenüber gewürfelter Richtung nichts bei**". Dazu immer drei beschreibende Zeilen:
„Bot: … R je Trade (t …), … % grüne Tage, schlechtester Tag … R"; „Zufallsrichtung: … R je Trade, … % grüne Tage, 23 grüne Tage in Folge
in … % der Blöcke"; „Zufallszeit: …". SPY und IWM nachrichtlich.

**2.10 Ein Lauf.** `REGEL.md` (dieser §2 wörtlich, dazu deine Lesarten), Code und Tests committen (**Siegel-Commit**), dann alles in einem
Durchgang, dann Ergebnis committen. Ein Fehler im Code wird benannt, behoben, wiederholt und unter `korrekturen` vermerkt. Ein Ergebnis,
das nicht gefällt, ist kein Fehler. Keine weitere Schwelle, kein weiterer Auslöser, keine „Verbesserung".

## B. Lesarten des Studien-Chats (vor dem ersten Lauf festgehalten)

Keine davon ist ein weiterer Parameter der Regel; jede füllt eine Stelle, an der §2 dem Code eine Entscheidung überlässt.

- **M1 Daten, Tage, Fenster, Lücken.** Leser `daten.js` aus Teil 1 unverändert (L1 und L17 dort): reguläre Kerzen 09:30–15:59, ein Block
  `regulaer` = ein Handelstag, Tage bis 30.09.2026, Lücken gehandelt, wie sie sind. Fenster wie Teil 1 (`kern.js` FENSTER). Im Lauf wird
  jede der 33 Jahresdateien genau einmal gelesen (Wert für Wert; die Reihe eines Werts bleibt im Speicher, bis er gerechnet ist).
- **M2 ATR.** Die erste Kerze des Archivs hat keine Vorkerze: ihre wahre Spanne ist Hoch − Tief. Vor der 14. Kerze des Archivs ist die
  ATR nicht definiert. Das Mittel wird an jeder Kerze aus genau 14 wahren Spannen neu summiert (keine laufende Summe, kein Rundungsdrift).
- **M3 Sperre.** Die ersten 250 Kerzen des Archivs (Index 0–249, 04.01.2016) geben kein Signal für die Auslöser, die EMA oder ATR
  benutzen: A1f und A2. A1 ist das Ereignis R1 aus Teil 1, das keine Sperre hat; A3 benutzt weder EMA noch ATR. Betrifft nur den ersten
  Tag von W-Vor.
- **M4 A1.** `ereignisse(R, zustandR1(R, VWAP), false, …)` aus Teil 1 über alle Tage; Richtung = neue Seite.
- **M5 A1f.** „Zusammengedrückt", wenn `0,5 × ATR(t) − |EMA9(t) − EMA21(t)| > 10⁻⁹ × Schluss(t)`. Ist der Abstand bis auf 10⁻⁹ des
  Kurses gleich 0,5 × ATR, ist das **nicht** zusammengedrückt (strenges „<" mit derselben Rechengenauigkeits-Schranke wie L2); A1 zählt dann.
- **M6 A2.** Seite = `seite(Schluss, EMA50)` aus Teil 1 (L2); Gleichstand hält die bisherige Seite. Der Zustand läuft ab der ersten Kerze
  des Archivs; die allererste Seite (aus „noch keine Seite") ist kein Wechsel. Ausgelöst wird ab Index 250. Die letzte Kerze eines Tages
  löst nichts aus — wechselt die Seite genau dort, vergleicht die erste Kerze des nächsten Tages mit der schon gewechselten Seite; der
  Wechsel wird nicht nachgeholt.
- **M7 A3.** Spanne über die an diesem Tag **vorhandenen** Kerzen mit Minute 09:30–09:44; gibt es keine, gibt es an diesem Tag kein A3.
  Ab Minute 09:45 (und nicht an der letzten Kerze des Tages): erster Schluss mit `seite(Schluss, Hoch) = +1` → Call, erster mit
  `seite(Schluss, Tief) = −1` → Put. Ein Schluss gleich dem Hoch bzw. Tief (bis auf 10⁻⁹) ist kein Ausbruch. Kerzen der Spanne lösen nie aus.
- **M8 „Alle".** Je Kerze aus A1f, A2, A3: kommen beide Richtungen vor, entfällt die Kerze (gezählt als „Widerspruch"); sonst die gemeinsame
  Richtung einmal (gezählt als „doppelt", wenn zwei oder drei zusammenfallen).
- **M9 Ereignis-Sicht.** `vorwaerts`, `kontrolle`, `ereignisSicht` aus Teil 1 (L13–L15 dort) für H = 1, 2, 3, 5, 10, 15. Die Kontrolle ist
  das Mittel über alle Tage desselben Kalenderjahrs im Archiv (L14). „Zahl der Ereignisse" ist das n der Zelle nach dem Wegfall für dieses
  H; die Zahl vor dem Wegfall steht als `signale` daneben.
- **M10 Satz der Ereignis-Sicht.** Mittel = Überschuss über die Kontrolle (`mittelBp`), t = Mittel / Standardfehler (L15); „t ≥ 2" und
  „Mittel ≥ 1,0" einschließlich; nicht definierte Werte ergeben „kein Richtungsvorteil".
- **M11 90 Zellen.** Gezählt werden die Zellen des Urteilsfensters mit |t| ≥ 2. Schwelle nach Bonferroni, zweiseitig 5 %, Normalnäherung:
  |t| ≥ Φ⁻¹(1 − 0,025/90) ≈ 3,45.
- **M12 Zeitablauf des Bots.** Kerze für Kerze: erst die Ausstiegsprüfung einer offenen Position für Kerze i (Schritte 1–5), dann der
  Auslöser nach dem Schluss von i. Einstiegskerze ist i+1 (immer derselbe Tag, weil die letzte Kerze nichts auslöst). Die Bedingungen
  werden in der Reihenfolge (a) offene Position, (b) Abkühlzeit, (c) Bremse, (d) 15:44 geprüft; ein verfallener Auslöser wird unter der
  ersten nicht erfüllten Bedingung gezählt.
- **M13 Abkühlzeit.** Innerhalb eines Tages: Minute der Einstiegskerze − Minute der Kerze des letzten Ausstiegs ≥ 5. Über die Nacht immer
  erfüllt; Abkühlzeit und Bremse beginnen jeden Tag neu.
- **M14 Grenzen.** „Bei oder unter" und „erreicht" mit derselben Schranke 10⁻⁹ in Einheiten von g (= 10⁻⁹ des Einstiegskurses): Stopp,
  wenn g(ungünstig) ≤ −0,1666 % + 10⁻⁹; scharf, wenn M ≥ 0,0588 % − 10⁻⁹; Rückfall, wenn g ≤ 0,6 × M + 10⁻⁹; Bremse, wenn realisiert
  ≥ 1,44 R − 10⁻⁹ (in g: 1,44 × 0,1666 %). „Erhöht" in Schritt 4 heißt echt größer.
- **M15 g, Ausstieg, R.** g(p) = Richtung × (p − Einstiegskurs) / Einstiegskurs. Ausstieg in g: Stopp −0,1666 % (oder g(Eröffnung)),
  Sicherung 0,6 × M (oder g(Eröffnung)), Tagesende g(Schluss). Netto = g − 0,0098 %; R = Netto / 0,1666 %. Ein Stopp genau an der Marke
  kostet also −1,0588 R nach Kosten, mit Lücke mehr. Die drei Schwellen werden aus Prämie 0,49 %, Delta 0,5 und 17 % / 6 % / 1 % gerechnet
  und stimmen mit den Zahlen in 2.6 auf 10⁻¹⁵ überein.
- **M16 Stopp vor Sicherung.** Schritt 1 geht Schritt 2 auch dann vor, wenn die Sicherung schon scharf ist (wörtlich „der ungünstige Fall
  zuerst"); eine Kerze, die die Marke und den Stopp erreicht, endet im Stopp.
- **M17 Bremse.** Realisiert = Summe der Netto-Ergebnisse (nach Kosten) der an diesem Tag vor der Einstiegskerze geschlossenen Trades.
- **M18 Z1.** Auslöser-Zeitpunkte = alle „Alle"-Auslöser des Fensters (nicht nur die Einstiege des Bots). Die Richtung wird bei jedem
  tatsächlichen Einstieg gewürfelt (½ zu ½, mulberry32). Ein Zufallsgenerator je Wert und Fenster, Startwert 89.210.000 + 100 × Wert-Nr. +
  10 × Fenster-Nr. (QQQ 0, SPY 1, IWM 2; W-Vor 0, W-Papier 1, W-Nach 2), die 200 Wiederholungen nacheinander aus demselben Strom.
- **M19 Z2.** Kandidaten = Kerzen mit Minute 09:45–15:44, die nicht die letzte ihres Tages sind. p = (Zahl der „Alle"-Auslöser im Fenster)
  / (Zahl der Kandidaten im Fenster). Je Kandidat ein Zug u < p → Auslöser, dann ein Zug für die Richtung. Startwert 89.220.000 + dasselbe
  Schema. Ein Auslöser an der Kerze 15:44 verfällt nach (d) (Einstieg 15:45) — wörtlich so.
- **M20 Kennzahlen.** Trades je Tag und Ertrag je Tag über alle Handelstage des Fensters. Gewinner = Netto > 10⁻⁹ (an g, nicht an einer
  Summe); Verlierer = alle anderen; mittlerer Gewinn/Verlust = mittleres R der Gewinner bzw. Verlierer. Ertrag je Trade = mittleres R;
  Standardfehler über Tage gebündelt mit der Formel L15 aus Teil 1 (Bündel = Tag, Summe der R des Tages). Grüner Tag = Tag mit mindestens
  einem Trade und Netto-Summe > 10⁻⁹. Serie, Blöcke, schlechtester und bester Tag nur über Tage mit Trade. Größter Rückschlag = größter
  Abstand der aufsummierten R nach jedem Trade unter ihrem bisherigen Gipfel, der Start 0 zählt als erster Gipfel. Kalenderjahre: Summe R,
  Trades, Tage mit Trade, grüne Tage.
- **M21 Quantile.** Lineare Interpolation an der Stelle p × (n − 1) der sortierten Werte über die Wiederholungen (n = Wiederholungen, in
  denen die Kennzahl definiert ist).
- **M22 Satz der Struktur-Sicht.** Ertrag je Trade des Bots echt größer als die 97,5-%-Stelle von Z1. SPY und IWM erhalten denselben Satz
  nachrichtlich.
- **M23 Eichung.** Teil des einen Laufs, erster Schritt nach dem Laden von QQQ: A1 (über `kern.js` → `liste` → `ereignisSicht` aus
  Teil 1) für QQQ, W-Nach, H = 5 und 15: Zahl der Ereignisse, Mittel und Standardfehler gleich denen in `ergebnis.json` von Teil 1 (R1,
  QQQ, W-Nach) bis 10⁻⁹ Basispunkte, und gerundet 11.736 / +0,02 / +0,08. Trifft das nicht, schreibt der Lauf `eichung.json` und endet,
  bevor er irgendetwas anderes rechnet.
- **M24 Füllung.** Ausstieg genau zum Stoppkurs bzw. zur Marke, wie die Regel sagt (ohne Rutsch). Bekannte Eigenschaft: siehe Teil C.
- **M25 Einheit.** Intern alles in g (Anteil des Einstiegskurses), R nur in der Ausgabe.
- **M26 Zwischenstände.** `ergebnis.json` wird nach jedem Wert geschrieben (`vollstaendig: false`), am Ende vollständig.

## C. Vor dem Siegel festgestellt (nur Kunstdaten; keine Archivdatei gelesen)

- **Datenaufbau** wie in Teil 1, REGEL.md Teil C (derselbe Leser, dieselben 2.701 Tage je Wert, dieselben Lücken). Nicht neu gezählt, damit
  jede Jahresdatei nur einmal gelesen wird.
- **Füllung an der Marke nimmt auf einem sprunghaften Kursweg den Überschuss mit.** Der erste Nullfall der Prüfung (Zufallsreihe ohne Kosten,
  Kerzen ohne Docht) ergab +0,083 R je Trade (t 3,6), auch mit gewürfelter Richtung. Eine zweite Rechnung aus den Kursen bestätigte den Code
  (0 Abweichungen); die Ursache ist das Kunstmodell: Ohne Docht springt der Kurs innerhalb der Minute gerade von der Eröffnung zum Schluss,
  ein Ausstieg genau an der Marke spart dann den Überschuss bis zum Schluss. Größe an Zufallsreihen mit S Teilschritten je Minute (1.200 Tage,
  Zufallsauslöser, ohne Kosten): S = 1 **+0,066 R** je Trade (t 7,0) · S = 4 +0,027 (t 3,2) · S = 20 +0,016 (t 2,1) · S = 60 +0,009 (t 1,3).
  Die Probe aus §3 läuft deshalb auf einer Reihe mit 60 Teilschritten je Minute; die Eigenschaft selbst ist als eigene Prüfung festgehalten.
  Für echte Minutenkerzen (aus Ticks zu 1 Cent ≈ 0,13–0,2 Basispunkte bei QQQ) ist eine Größenordnung um 0,01 R je Trade zu erwarten —
  nicht gemessen. Sie trifft Bot, Z1 und Z2 gleich (der Vergleich bleibt), macht aber die absoluten R-Zahlen etwas zu günstig.
- **Erreichbarkeit der Sätze an Kunstfällen** (Regime-Drift μ Basispunkte je Minute, Rauschen 2 Basispunkte je Minute, 250 Tage):
  μ = 0,5 → Hauptzelle +0,54 Bp (Standardfehler 0,04, t 13) „vorhanden, aber unter der Hürde"; μ = 1,2 → +2,88 Bp (t 33) „über der
  Hürde"; μ = 2 → +7,1 Bp; μ = 0 → +0,05 Bp (t 1,6) „kein Richtungsvorteil". Struktur: μ = 0,5 → Bot +0,177 R gegen Z1-97,5-%-Stelle
  +0,095 R „tragen etwas bei"; μ = 0 → −0,032 gegen +0,013 „nichts bei".
