# Der große Plan — Stand 26.08.2026

Geschrieben vom Projekt-Manager auf Wilhelms Auftrag. **Ein Vorschlag, keine Festlegung.**
Die mit **[W]** markierten Punkte entscheidet Wilhelm; alles andere ist verteilbar.

---

## Teil I — Wo wir stehen

### Die eine Zahl, aus der alles folgt

Am 26.08. wurden alle zwölf laufenden Strategien neu durchgerechnet. Ergebnis:

| Urteil | Zahl |
|---|---|
| **belegt** | **0** |
| nicht bestätigt (gemessen, trägt nicht) | 2 |
| nicht entscheidbar (Lineal zu grob) | 9 |
| nicht messbar | 1 |

**Neun von zwölf sind nicht am Markt gescheitert, sondern am Messgerät.** Das ist keine
Meinung, sondern rechenbar: Eine Kante in der Größe der eigenen Kostenhürde (0,10 Pp je
Umlauf) bräuchte rund **8.770 Bestätigungs-Signaltage — 35 Jahre**. Das Tagesarchiv hat
5.038 in der Bestätigungshälfte. Nicht mit einer besseren Methode, nicht mit einem
besseren Detektor: **nie.**

**Fünf** der zwölf liegen jenseits von 12.000 Handelstagen — unerreichbar mit diesem
Datenbestand, egal wie lange gewartet wird. **Zwei weitere haben GAR KEINE Aussicht**
(`winkelbestaetigt`, `winkelgrad`): ihr Überschuss ist in allen zehn Varianten negativ.
Sie sind nicht zu weit weg, sie zeigen in die Gegenrichtung — ein anderer Sachverhalt.
*(Richtigstellung 26.08. 20:40: hier stand „sieben", der PM hatte beides in eine Zahl geworfen.)*

### Was das NICHT heißt

„Nicht entscheidbar" heißt nicht „wertlos". Aus denselben Protokollen lässt sich eine
**obere Grenze** lesen — und dort steht bereits echtes Wissen:

- **5 von 35 Varianten sind erledigt**: selbst der optimistischste mit den Daten
  verträgliche Wert trägt die Kosten nicht. Diese fünf müssen nie wieder durchsucht werden.
- Beim Standard-Schein (0,23 Pp) sind es sogar 23 von 35.

*(Richtigstellung 26.08. abends: hier stand „von 25" und „13 von 25" — Stand vor der
Messung der zwei Winkel-Strategien mit je 5 Varianten. Aktuelle Zahlen aus
`tools/obergrenzen-bericht.js`, von der QS gezogen; der Fehler ging zugunsten des
Projekts — es ist mehr ausgeschlossen als behauptet.)*

**Das ist der ehrlichste Ertrag des bisherigen Aufwands:** nicht eine gefundene Kante,
sondern ein systematisch verkleinerter Suchraum.

### Der Engpass hat einen Namen: Haltedauer

Das Muster über alle Messungen ist eindeutig und kein Zufall:

| Haltedauer | Bandbreite der Messung | Folge |
|---|---|---|
| kurz (Stunden bis 1 Tag) | eng | größtenteils **erledigt** — dort ist nichts Großes |
| lang (26–63 Tage) | sehr weit | **kaum gemessen** — dort könnte etwas sein |

Genau darin liegt die Zwickmühle: **Kurz halten ist messbar, aber die Kosten fressen die
Kante. Lang halten trägt die Kosten leicht, ist aber nicht messbar.**

---

## Teil II — Die drei Hebel, die es wirklich gibt

Nicht „mehr Detektoren". Der Suchraum ist nicht das Problem; das Auflösungsvermögen ist es.
Es gibt genau drei Stellschrauben, und alle drei sind bereits vermessen:

### Hebel 1 — Die Messanordnung (Faktor rund 1,5, **schon geeicht**)

Für lange Haltedauern war die bisherige Anordnung **54 % zu konservativ**. Wer jeden Tag
eine 63-Tage-Position eröffnet, hat nicht 252 unabhängige Beobachtungen im Jahr, sondern
vier. Die Abhilfe ist keine andere Statistik, sondern ein Depot auf festem Kalender.

**Diese Eichung ist am 25.08. durchgelaufen und bestanden** (Verhältnis 1,543; über alle 63
Rasterlagen Minimum 1,342). In derselben Anordnung geht `momentum` von t = 1,03 auf
**t = 2,10**. Die Anordnung ist damit freigegeben — die Messung selbst steht aus.

### Hebel 2 — Die Haltedauer (Faktor rund 15)

Über Nacht (H = 1) fällt die nötige Auflösung von 0,605 auf **rund 0,040 Pp** — und damit
**unter die Aktienhürde von 0,04**. Das ist der einzige bekannte Bereich, in dem eine
Kante überhaupt nachweisbar wäre.

Genau dort arbeiten die beiden vorregistrierten Kandidaten des Tüftlers. Der dafür nötige
`ausstiegsZeitpunkt`-Schalter ist **seit dem 26.08. fertig** und an allen drei Stellen
zugleich belegt (Signal, Kontrolle, Placebo).

### Hebel 3 — Die Kostenhürde selbst (Faktor bis 5,75)

| Produkt | Hürde je Umlauf |
|---|---|
| Aktie | 0,04 Pp |
| CFD | 0,10 Pp |
| Standard-Schein | 0,23 Pp |

Jede Kante wird gegen diese Zahl gemessen. Wer vom Schein auf den Basiswert wechselt,
senkt die Hürde um fast das Sechsfache — **das wirkt stärker als jede Detektor-Idee.**
Ungeprüft ist bisher, was eine **Auktionsfüllung** wirklich kostet; die Tabelle beschreibt
die notierte Spanne, nicht den Schluss- oder Eröffnungsauktionspreis. Übernacht-Handel
füllt aber genau dort.

---

## Teil III — Vier Stränge, verteilbar

### Strang A — Die eine große offene Frage zu Ende messen

**`momentum` in nicht überlappender Anordnung.**
Der einzige Ort im ganzen Korpus, an dem eine große Kante noch möglich ist — und zwar
gerade weil er so schlecht gemessen ist. Die Anordnung existiert bereits als virtuelles
Buch in `mfdepot.js` und ist nie durch die Mühle gegangen. Die Eichung ist bestanden.
**Sucht nichts Neues; misst das Einzige richtig, was noch offen ist.**

→ Bausitzung / Messkette. Braucht eine eigene Vorregistrierung.

### Strang B — Auf messbares Terrain umstellen (die Übernacht-Familie)

Zwei Kandidaten sind vorregistriert und seit heute technisch messbar.
**Vorbehalt, offen ausgewiesen:** beide messen dasselbe Fenster auf demselben Korpus —
familienweit vier Tests, `delta80` steigt damit auf 0,0429 und **über** die Aktienhürde.
Die Ja-Schwellen bleiben erreichbar, die Nein-Aussage gilt nur studienweise. **[W]**

→ Messkette. Der Tüftler liefert nach, misst aber nie selbst.

### Strang C — Die Kostenhürde angreifen

1. **Auktionskosten am Demo-Konto messen** — am 26.08. freigegeben, **noch nicht
   angefangen**. Läuft unabhängig von allem anderen und kostet kein echtes Geld.
2. **Basiswert statt Schein** als Regelfall — die wirksamste einzelne Maßnahme
   überhaupt. **[W]** (steckt in #72 Punkt 3)

→ Bausitzung, unabhängig parallel.

### Strang D — Die App sagt die Wahrheit über sich selbst

Der teuerste Fehler dieses Projekts war stets, dass der Code mehr behauptete als das
Protokoll hergab. Vier offene Punkte:

- **Auflösungswand sichtbar machen** — die Aussicht je Strategie steht in den Protokollen,
  aber nirgends in der Oberfläche. **[W]** (offene Frage 1)
- **#92** Rangfolge der Urteile — `messmaschine.js:1214`, baubereit. **[W]** für die Regel
- **#80** Kanal-Güte: Rauschen bekommt im Median 75 von 100. **[W]** für den Weg
- **#96** Platzhalterkerze. **[W]**

→ Bausitzung nach Wilhelms Entscheid.

### Strang E — Der Betrieb (läuft bereits, kein Auftrag)

Archiv-Nachladen 22:15 mit Wachhund · Übergabe-Briefkasten · PM im Dauerlauf ·
nächtliche Rollen. **Erster echter Prüfstein ist die Nacht auf den 27.08.**

---

## Teil IV — Die unbequeme Möglichkeit

**Es kann sein, dass hier nichts zu finden ist.** 3.372 Tests in der großen Signalstudie,
0 von 51 bestätigt. Zwölf Strategien, null Belege. Das ist mit „der Markt ist effizient
genug, dass nach Kosten nichts übrig bleibt" vollständig vereinbar.

Ein Plan, der diese Möglichkeit nicht einkalkuliert, ist kein Plan, sondern eine Hoffnung.
Deshalb gehört sie hier ausgeschrieben — und deshalb ist **Strang D kein Anhängsel:**
Wenn am Ende keine Kante steht, ist das Wertvolle an dieser App das, was sie über den
Markt **ausschließt**, und wie ehrlich sie es anzeigt.

**Ein Abbruchkriterium, das der PM vorschlägt:** Sind Strang A und B durchgemessen und
liefern beide kein Ja, wird nicht weiter nach Detektoren gesucht. Dann wird die App das,
was sie ohnehin am besten kann — ein ehrliches Messgerät und ein gutes Werkzeug. **[W]**

---

## Teil V — Wer was macht

| Rolle | Takt | Strang |
|---|---|---|
| **Strategie-Tüftler** | nachts 04:30 | B — entwirft, prüft gegen die Wand, misst nie selbst |
| **Analytiker** | nachts 03:15 | A, B — rechnet unabhängig nach |
| **Auditor** | nachts 01:00 | D — Oberfläche, funktional und optisch |
| **Bausitzung (Chat)** | auf Zuruf | A, C, D — baut und misst |
| **Issue-Wache** | alle 30 Min | D — sichtet, baut nichts |
| **Archiv-Nachladen** | 22:15 | E |
| **Projekt-Manager** | Dauerlauf | verteilt, fragt, überträgt |

**Die Engstelle ist nicht Arbeitskraft, sondern Entscheidung.** Die **[W]**-Punkte
blockieren derzeit mehr als jede fehlende Sitzung.

---

## Nachtrag 26.08. 18:30 — die Überlebenslücke trifft diesen Plan an der Wurzel

Der Strategie-Tüftler hat die Lücke des großen Archivs vermessen (Lauf 16:56–18:20):

- Über 2008–2026 fehlen **mindestens 12,7 %** des Querschnitts — **ausschließlich
  Nicht-Überlebende**, steigend von rund 8 % (2008) auf **20 % (2023)**.
- Vor dem 29.06.2004 ist die Lücke nicht einmal diagnostizierbar.
- **Mit den vorhandenen Mitteln nicht zu schließen:** die eine Quelle liefert 1 von 46,
  die andere deckelt auf den Tag genau bei zwei Jahren.

**Warum das hier oben steht und nicht in einer Fußnote:** Strang A und Strang B rechnen
beide auf diesem Universum. Fehlen ausschließlich die Verschwundenen, ist **jede positive
Rohrendite nach oben verzerrt — in genau der Richtung, in der wir etwas finden wollen.**
Das ist kein Nebenrisiko, das ist die Hauptfehlerquelle dieses Plans.

**Vorschlag C des Tüftlers (Entscheidung, kein Bauauftrag) [W]:** drei Wege — bezahlte
Datenstufe · Lücke offen lassen und ausweisen · **auf den bereits beschafften 1.164
Verschwundenen die *Richtung* der Verzerrung messen.**

*Der PM unterstützt die Reihenfolge des Tüftlers: **den dritten zuerst.** Er ist der
billigste und beantwortet, ob die anderen beiden überhaupt eine Frage sind. Daten zu
kaufen, bevor man weiß, ob die Lücke die Ergebnisse dreht, wäre die falsche Reihenfolge.*

**Für Strang B festgehalten:** Die Einschränkung „auf einem Universum ohne Rückschau
gemessen" darf für `glockendruck-nacht` und `nachtstoss-umkehr` **nicht fallen**.

### Drei Datenfunde, am 26.08. zugeteilt (Datenqualität, unstrittig)

1. **Falsche Delistings** in `massive/verschwundene.json` — AVB, EQR, LBRDA, LBRDK, WBS
   stehen als delistet, handeln aber. **Ursache vom PM gefunden: sie sind nicht delistet,
   sie sind im Archiv stehengeblieben** (letzte Kerze 20./21.08., während 2.955 von 2.965
   auf dem 25.08. stehen). Eine Ausschlussliste, die AvalonBay auswirft, verzerrt jedes
   Universum, das sie benutzt.
2. **`tools/massive-tagesdaten.js:29`** holt neun Monate weniger als es glaubt — die
   Quelle antwortet bei Überlappung der Zwei-Jahres-Grenze nicht mit einem Fehler, sondern
   mit **stillschweigend abgeschnittenen Daten**.
3. **Der Wachhund rundet die Wahrheit weg.** Er meldete „100 % auf Stand", tatsächlich
   hängen **zehn Reihen** zurück. Gezählt wird richtig (`archiv-wachhund.js:170`), aber
   Zeile 184 rundet 99,66 % auf 100 %.
   **Das ist die sechste Verkleidung derselben Sache an einem Tag — diesmal in der
   Sicherung, die genau dagegen gebaut wurde.** Und sie hätte Fund 1 verhindert: hätte er
   „99,7 %" gemeldet, wäre die Lücke am selben Tag aufgefallen statt über eine
   Delisting-Liste.

---

## Teil IV-a — Das Abbruchkriterium, verschärft (Wilhelm, 26.08. 18:35)

**Wilhelms Entscheidung zu allen drei Vorlagen: ja, ja, ja — aber das Abbruchkriterium
gilt nicht so, wie der PM es vorgeschlagen hatte.** Wörtlich:

> *„nach messverfahrensprüfung und gegenprobe mit ideenfindung warum es nicht geklappt
> haben könnte, wenn dann immernoch nichts bei rumkommt ist das wohl das
> abbruchkriterium, ich will zu 100 % sicher sein nicht zu 99,9"*

**Der Vorschlag des PM war zu billig.** Er lautete: Strang A und B durchmessen, beide kein
Ja, Ende. Das hätte einen Abbruch erlaubt, dessen wahrer Grund ein kaputtes Messgerät ist
— **und genau dieser Fehler ist an diesem Projekt schon sechsmal an einem einzigen Tag
aufgetreten.** Ein Nein aus einer defekten Messung ist kein Nein, es sieht nur so aus.

### Vor jedem Abbruch sind drei Stufen zu durchlaufen

**Stufe 1 — Messverfahrensprüfung.**
Bevor ein Nein gilt, wird das Instrument geprüft, nicht das Ergebnis. Placebo-Lauf
(richtige Antwort: null), Nullpunkt, Kontrolltopf, Live-gleich-Messung, alle Sperrklinken.
**Ein Nein, das aus einer ungeprüften Maschine kommt, zählt nicht.**

**Stufe 2 — Gegenprobe mit Ideenfindung: warum könnte es nicht geklappt haben?**
Ausdrücklich **nicht** „war die Idee schlecht", sondern: *Was hätte die Messung daran
hindern können, eine vorhandene Kante zu sehen?* Zu prüfen sind mindestens:
Auflösungswand · Überlebenslücke · geteilte Kurse · Haltedauer · Kostenannahme ·
Produktwahl · Zeitzonen · Universumsfilter · Testfamilie · Regime.
**Jede dieser Erklärungen ist eine eigene Messung wert, bevor sie verworfen wird.**

**Stufe 3 — erst dann.**
Bleibt nach Stufe 1 und 2 immer noch nichts, ist das das Abbruchkriterium.

### Die Haltung dahinter, und sie gilt über diesen Plan hinaus

**„Zu 100 % sicher, nicht zu 99,9."** Das ist an demselben Tag gesagt worden, an dem der
frisch gebaute Wachhund 99,66 % auf 100 % gerundet und damit zehn veraltete Datenreihen
verschluckt hat. **Die 0,1 %, die man wegrundet, sind genau die, in denen der Fehler
sitzt.** Das gilt hier für Abbruchentscheidungen genauso wie dort für Prozentanzeigen.

### Was das für die Reihenfolge bedeutet — abgeleitet, nicht angeordnet

Die drei Datenfunde vom 26.08. und die Überlebenslücke sind damit **keine Nebenarbeit
mehr, sondern Vorbedingung.** Strang A auf einem Universum zu messen, dem 12,7 %
ausschließlich Nicht-Überlebende fehlen und dessen Ausschlussliste handelnde Werte
auswirft, erzeugt ein Ergebnis, das Stufe 2 ohnehin wieder einkassiert.

**Reihenfolge daher: Datenqualität → Strang A → Strang B.**


---

## Teil IV-b — Nachtrag 26.08. 21:00: die Etiketten selbst sind unscharf

**Beobachtet an `rsi2seit-mcp`, zweimal an einem Tag:** Variante 3 kippte morgens von
„nicht bestätigt" auf „nicht entscheidbar" (Abstand −0,0002 Pp) und abends zurück
(+0,0001 Pp). **Dieselbe Variante, beide Richtungen, auf Zehntausendstel eines
Prozentpunkts** — ausgelöst allein durch zwei zusätzliche Handelstage.

**Die Grenze zwischen den beiden Nein-Sorten ist dort keine Eigenschaft des Marktes,
sondern Rauschen.** Wer in diesem Plan mit „2 nicht bestätigt, 9 nicht entscheidbar"
rechnet, rechnet mit Etiketten, die für Grenzfälle nicht stabil sind. **Für die
Unterscheidung, auf die es ankommt — trägt eine Kante die Kosten? — ändert das nichts:**
„bestätigt" war bei t = 2,00 gegen eine Schwelle von 2,576 nie in Reichweite.

**Was sich sehr wohl ändert: die Eintrittskarte hat keinen Kandidaten mehr.** Alle drei
Strategien unter 1.500 Handelstagen sind erledigt — `monatsende-kauf` (Zahl entwertet),
`kapitulation` und `rsi2seit-mcp` (beide nicht bestätigt). **Aus dem laufenden Korpus
kommt nichts mehr nach.** Neues muss aus Strang A oder B kommen; das ist jetzt keine
Bevorzugung mehr, sondern der einzige Weg.


### Nachtrag 26.08. 22:00 — Teil IV-b ist teilweise falsch

Oben steht, die Aussicht werde durch frische Handelstage schlechter. **Das war eine
Zwei-Tage-Momentaufnahme.** Über die ganze Messhistorie zurückgerechnet: **14 Übergänge
gefallen, 12 gestiegen** — praktisch ein Münzwurf. *Die Aussage ist gestrichen; die QS hat
sie selbst widerlegt.*

**Was an ihre Stelle tritt und schwerer wiegt:** `tage80` skaliert mit 1/Effekt² und ist
über die eigene Messhistorie **nicht reproduzierbar** — Median-Faktor **2,4**, im Extrem
**72** bei derselben Variante. **Wilhelms Eintrittskarte bei 1.000 Handelstagen ist damit
feiner als die Zahl, an der sie misst.** Empfehlung der QS: als Schranke **`delta80` gegen
die Kostenhürde** nehmen — Effektgröße gegen Effektgröße, ohne Schätzer im Nenner.
**Entscheidung offen, liegt bei Wilhelm.**
