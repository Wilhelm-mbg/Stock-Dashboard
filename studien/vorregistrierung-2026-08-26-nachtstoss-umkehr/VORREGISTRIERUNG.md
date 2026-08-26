# Vorregistrierung — `nachtstoss-umkehr`

**Geschrieben am 26.08.2026 vom Strategie-Tüftler, bevor irgendeine Rendite gerechnet wurde.**
Der Tüftler misst nicht. Alle Zahlen unten sind Anzahlen, Streuungen, Beharrlichkeiten und
Überschneidungen; kein Mittelwert einer Rendite wurde berechnet, gedruckt oder abgelegt.
Werkzeuge: `studien/tueftler/werkzeug/zaehle-nachtstoss.js` und
`…/zaehle-spannenrueckprall.js`, Rohausgabe unter `studien/tueftler/daten/`.

**Schwesterstudie:** `studien/vorregistrierung-2026-08-26-glockendruck-nacht/`. Beide messen
dasselbe Fenster (Übernacht, H = 1, `archiv1d`), aber mit **unabhängiger Auswahl**
(Überschneidung 0,190 gegen eine Zufallserwartung von 0,198 — also keine). Abschnitt 8
sagt, was das für die Testzahl der Familie bedeutet.

---

## 0. Warum dieser Entwurf neben `glockendruck-nacht` steht

Weil `glockendruck-nacht` einen Konstruktionsfehler hat, den ich in der Nacht davor nicht
gesehen habe, und dieser Entwurf ihn nicht hat.

Die Zielgröße ist `Eröffnung(i+1) / Schluss(i) − 1`. Der Schlussdruck
`S = (Schluss(i) − Tief(i)) / (Hoch(i) − Tief(i))` **teilt den Kurs `Schluss(i)` mit ihr —
und zwar mit entgegengesetztem Vorzeichen.** Ein Schluss, dessen letzter Druck auf dem
Geldkurs steht, senkt `S` *und* hebt die gemessene Übernachtrendite. Das ist die klassische
Spannen-Umkehr, und sie erzeugt einen Scheineffekt in **exakt der Richtung, die
`glockendruck-nacht` behauptet.**

Wie groß das ist, wurde gezählt (`zaehle-spannenrueckprall.js`, 400 Symbole, 9.499 Tage):

| Größe im untersten `S`-Quintil | Wert |
|---|---|
| Anteil der Tage mit Schluss **exakt** auf dem Tagestief | **6,4 %** |
| Anteil mit `S` < 0,05 | **23,1 %** |
| `S`-Median der Auswahl | 0,124 |
| Tagesspanne, Median | 2,52 Pp (Korb 2,30 Pp) |

Die halbe notierte Spanne einer solchen Aktie liegt bei ~0,02 Pp (Kostentabelle: 0,04 Pp je
Umlauf). Ein knappes Viertel der ausgewählten Tage schließt praktisch auf dem Tief, und die
Auswahlregel selbst ist auf „letzter Druck war ein Verkauf" gerichtet — die Auswahl ist
also systematisch zum Geldkurs geneigt, nicht zufällig.

Das ist für die **JA**-Seite von `glockendruck-nacht` verkraftbar: 0,02 Pp sind höchstens
ein Fünftel der JA-Schwelle von 0,10 Pp. Für die **NEIN**-Seite ist es das nicht. Dort
liegt der Abstand zwischen `delta80` (0,0397) und der Aktienhürde (0,04) bei **0,0005 Pp**.
Ein Rückprall-Beitrag von wenigen Tausendstel Pp beherrscht diese Marge um ein Vielfaches.
Die schöne Aussage „das Sitzungsgrenzen-Fenster ist über 40 Jahre unterhalb von 0,04 Pp
geschlossen" ist also **nicht rückprall-fest**, solange sie am Schlussdruck hängt.

Dieser Entwurf teilt **keinen Kurs** mit der Zielgröße:

| | Signal liest | Zielgröße liest |
|---|---|---|
| `glockendruck-nacht` | Hoch(i), Tief(i), **Schluss(i)** | **Schluss(i)**, Eröffnung(i+1) |
| **`nachtstoss-umkehr`** | Schluss(i−1), **Eröffnung(i)** | Schluss(i), Eröffnung(i+1) |

Disjunkt. Und er hat, das ist der zweite Gewinn, **keinen C8-Vorgriff**: `O(i)` steht um
09:31 fest, die Entscheidung für eine Market-on-Close-Order fällt Stunden später mit
vollständiger Kenntnis des Signals. `glockendruck-nacht` muss `S` zum Zeitpunkt der
Auftragserteilung raten und deshalb als **obere Schranke** gemeldet werden (dortiges
Gatter 3). Hier entfällt dieser Vorbehalt ersatzlos.

Bei **praktisch gleicher Auflösung**: `delta80` 0,0396 Pp gegen 0,0397 Pp.

---

## 1. Frage

Zahlt das Übernachtfenster einen **Überschuss über den eigenen Langfristdurchschnitt
desselben Symbols**, wenn der Wert an diesem Morgen — gemessen an seiner eigenen üblichen
Übernachtbewegung — am stärksten heruntergerissen worden ist, und liegt dieser Überschuss
über der Kostenhürde des gehandelten Produkts?

## 2. Mechanismus — wer zahlt hier wem wofür

Die Eröffnungsauktion ist das Fenster mit der **dünnsten Beteiligung des ganzen
Handelstags** und zugleich das Fenster, in dem der meiste terminfixe Fluss auf einmal
abgewickelt wird: Market-on-Open-Aufträge, über Nacht eingestellte Privatanleger-Orders,
Nachbildungsfluss, Anpassungen aus der Nacht. Diese Aufträge fragen nicht nach dem Preis,
sondern nach dem Zeitpunkt. Wer die Gegenseite stellt, tut das gegen ein Zugeständnis —
und ein Teil des Eröffnungskurses ist deshalb kein Wert, sondern **Druck**.

Der Druckanteil wird zurückgezahlt, sobald wieder genug Beteiligung da ist. Die Frage
dieser Studie ist **wann**: schon im Tagesverlauf, oder erst in der nächsten Nacht.

Warum es die nächste Nacht sein könnte, und nicht der Tag: Wer das Lager übernommen hat,
kann es innertags glattstellen, ohne Risiko über die Sitzungsgrenze zu tragen. Ein
Überschuss, der im Tagbein sitzt, ist gewöhnliche kurzfristige Gegenbewegung und wird von
Innertags-Kapital eingesammelt. Ein Überschuss, der im **Nachtbein** sitzt, verlangt, dass
jemand über Nacht unbewirtschaftet hält — kein Stop, kein Ausstieg, keine Absicherung —
und ist damit eine **Risikoprämie**, die nicht wegarbitriert wird.

**Richtung der These: Umkehr (long das unterste Quintil), und sie ist begründet, nicht
geraten.** Aus dem Literatur-Dossier vom 26.08.
(`studien/tueftler/recherche-2026-08-26/DOSSIER.md`), das für die Schwesterstudie
angelegt wurde und dieselbe Familie abdeckt:

- **Lou, Polk & Skouras (2019, JFE 134)** zerlegen die Kurzfrist-Umkehr nach Fenstern: das
  Umkehr-Alpha sitzt im **Nachtbein** (+0,93 %/Monat, t = 4,28) und ist im **Tagbein negativ**
  (−1,05 %, t = −3,25). Genau die Trennung, die Zweig N gegen Zweig T stellt.
- **Boyarchenko, Larsen & Whelan (2023, RFS 36)** finden die Übernachtprämie im
  Inventar-Management der Intermediäre und berichten eine **Asymmetrie: nach Ausverkäufen
  robuste positive Übernacht-Umkehr, nach Kauftagen nicht.** Das ist der Grund, warum
  hier die **Runter**-Seite geprüft wird und nicht das Spiegelbild.
- **Berkman, Koch, Tuttle & Zhang (2012, JFQA 47)** und **Amihud & Mendelson (1987)**:
  Eröffnungskurse sind lauter als Schlusskurse, mit anschließender kleiner Gegenbewegung.
  Das ist die Quelle des Druckanteils, den dieser Entwurf abgreifen will.

Die Gegenthese steht in derselben Literatur und ist ernst zu nehmen: Lou/Polk/Skouras
finden **Fortsetzung** der Übernachtrendite im eigenen Fenster über Monate. Kommt Zweig N
signifikant mit **negativem** Vorzeichen heraus, ist das der Fortsetzungsbefund und nicht
etwa „nichts" — Abschnitt 6 hält das als eigenen Ausgang fest, damit es hinterher niemand
umdeuten muss.

**Abgrenzung zu `glockendruck-nacht`.** Dort ist das Druckereignis die **Schlussauktion**
(MOC-Fluss, Zwangsglattstellung), hier die **Eröffnungsauktion** (MOO-Fluss, Nachtaufträge).
Verschiedene Tageszeit, verschiedene Zahler, verschiedene Kurse — und die Auswahl
überschneidet sich nur zufällig (0,190 gegen 0,198). Es sind zwei Schüsse, nicht einer.

## 3. Signalregel — vollständig, vor der Messung festgelegt

Zeitrahmen **1d**, Archiv `E:/Markt-Dashboard-Archiv/archiv1d`, Universum **CS + ADRC**
nach `wertpapierart.js` (keine Namensliste).

Je Handelstag *i* und Symbol:

1. **Zulassung:** Umsatz(i) = Schluss(i) × Stück(i) ≥ **5 Mio $** (derselbe Schnitt wie in
   Studie 2 und in der Schwesterstudie), Hoch(i) > Tief(i) > 0, Eröffnung(i) > 0,
   Schluss(i−1) > 0, Eröffnung(i+1) vorhanden und > 0.
2. **Kennzahl:**
   `O(t) = Eröffnung(t) / Schluss(t−1) − 1` in Pp;
   `z1(i) = O(i) / sd(O über die 59 Tage i−59 … i−1)`.
   **Das laufende `O(i)` gehört ausdrücklich NICHT in den Nenner** — sonst normiert sich
   der Ausreißer selbst weg. Fenster 60 Kerzen einschließlich des Signaltages, davon
   59 im Nenner.
3. **Auswahl:** `z1` im **untersten Quintil** des an diesem Tag zugelassenen Querschnitts.
   Genau ein Quintil. Keine Dezil-, Terzil- oder Schwellenvariante — jede wäre ein
   weiterer Test.
4. **Richtung:** long.
5. **Zweig N (primär):** Einstieg **Schluss(i)**, Ausstieg **Eröffnung(i+1)** — das
   Nachtbein. Braucht den `ausstieg`-Schalter (Abschnitt 7, Gatter 1).
6. **Zweig T (Trennschärfe):** Einstieg **Eröffnung(i+1)**, Ausstieg Schluss(i+1) — das
   Tagbein. Läuft mit der heutigen Maschine über `einstieg: 'folgeEroeffnung'`, H = 1.

`leseFensterKerzen: 61` — die Kontrolle muss die 60 Kerzen aussparen, die das Signal
gelesen hat, sonst entsteht die Nullpunktverschiebung **A6/A7**.

**Gemessener Signalanteil, vorab gezählt: 19,8 %** des zugelassenen Querschnitts, an
praktisch jedem Handelstag; Breite 33/Tag in der Stichprobe.

**Warum die Entscheidung ausführbar ist, ohne Vorgriff:** `z1(i)` steht mit dem
Eröffnungsdruck des Tages *i* fest, also um 09:31. Der Einstieg liegt zu `Schluss(i)`.
Zwischen Signal und Auftrag liegen mehr als sechs Stunden. Der Einstiegs**kurs** ist beim
Auftragszeitpunkt naturgemäß unbekannt — das ist eine gewöhnliche Market-on-Close-Order und
kein Vorgriff. Die Größe, an der die Auswahl hängt, ist es nicht.

## 4. Datenbasis und Machbarkeits-Check

Gezählt am 26.08.2026, `zaehle-nachtstoss.js`, Stichprobe **400 Symbole** (jedes ~5,6-te
der zugelassenen Reihen; 2.966 Reihen im Archiv insgesamt):

| Größe | Wert |
|---|---|
| Reihen von F1 (`reiheKaputt`) verworfen | 5 von 400 (1,3 %) |
| Extremwerte ausgeworfen (\|r\| > 25 Pp) | 310 von 1.602.686 (0,02 %) |
| Symbol-Tage nach Liquiditätsschnitt | **1.602.376** |
| Handelstage mit Breite ≥ 20 | **9.471** (18.11.1986 – 20.08.2026) |
| **Bestätigungshälfte (B5)** | **4.736 Tage** |
| Breite der Auswahl, Median | 33/Tag in der Stichprobe (≈ 185/Tag im vollen Universum) |
| Umsatz-Median der Auswahl | **36,6 Mio $** — Gesamtkorb **36,5 Mio $** |

**Keine Kostenneigung.** Die Auswahl ist im Umsatz nicht vom Korb zu unterscheiden
(36,6 gegen 36,5 Mio $). Das ist besser als bei der Schwesterstudie (34,4 gegen 36,5) und
schließt die naheliegende Sorge aus, ein Übernacht-Ausverkaufs-Signal fische die
teuer handelbaren Werte heraus.

**Streuung und Nachweisgrenze** (Bestätigungshälfte, Tagesmittel des Querschnitts):

| Größe | Wert |
|---|---|
| Streuung σ der Tagesmittel | **0,8833 Pp** |
| se = σ / √4.736 | **0,01284 Pp** |
| MDE (Hausmaß, `mdeFaktor` = 2) | **0,0257 Pp** |
| `delta80` bei 1 Test (\|z\| ≥ 1,960) | 0,0360 Pp |
| **`delta80` bei 2 Tests (\|z\| ≥ 2,2414)** | **0,0396 Pp** |
| `delta80` bei 4 Tests (\|z\| ≥ 2,4977) | 0,0429 Pp |
| Korpus-Median `delta80` der 38 Varianten | 0,605 Pp → **Faktor 15,3 schärfer** |

**Kostenhürden zum Vergleich** (`signalstudie-2026-08/BERICHT.md`, gültig für US-Großwerte
2026 und für sonst nichts): Aktie 0,04 — Schein ATM 0,05 — CFD 0,10 — Standard-Schein 0,23,
je Umlauf. **Der Standard-Schein wird nicht gemessen**: bei 252 Umläufen im Jahr sind das
58 Pp Kosten, der Kandidat ist auf diesem Produkt tot, bevor gerechnet wird.

## 5. Warum diese Fassung und keine der drei anderen

Vier Fassungen derselben Idee wurden vorab gezählt und **nach Beharrlichkeit, Streuung und
Überschneidung ausgewählt — ohne einen einzigen Ertrag anzusehen.** Deshalb verbraucht
dieser Vergleich keine Tests; er steht hier, damit ihn niemand später für eine verdeckte
Suche halten muss.

| Fassung | Beharrlichkeit (Zufall 0,198) | σ (Pp) | `delta80` (2 T.) | Überschneidung mit `S` | Urteil |
|---|---|---|---|---|---|
| **F `z1` runter** | **0,217** | **0,8833** | **0,0396** | **0,190** | **gewählt** |
| G `z1` hoch (Spiegel) | 0,229 | 0,8849 | 0,0396 | 0,203 | nicht vorregistriert, siehe unten |
| H `z3` über drei Nächte | **0,561** | 0,8892 | 0,0398 | 0,190 | **verworfen — A7 kürzt sie weg** |
| I `O(i)` ohne Normierung | 0,222 | 0,9977 | 0,0447 | 0,192 | verworfen — 13 % schlechtere Auflösung |

Drei Sätze dazu, die ich mir selbst nicht ersparen will:

- **H ist der Fehler der Vornacht in klein.** Drei Nächte zu addieren macht aus einer
  zeitlich wechselnden Bedingung wieder eine **Symbolneigung**: Beharrlichkeit 0,561 gegen
  0,198 Zufallserwartung. Die A7-Kontrolle zieht jedem Symbol seinen eigenen
  Langfristmittelwert ab; ein zu 56 % konstantes Merkmal hat gegen sie per Konstruktion
  wenig zu holen. Derselbe Mechanismus, der den Kandidaten `V` (0,943) erledigt hat, nur
  langsamer.
- **Bei I lag ich mit meiner Begründung falsch, und das gehört hierher.** Ich hatte
  erwartet, dass die unnormierte Fassung die schwankungsfreudigen Symbole dauerhaft
  auswählt und an der Beharrlichkeit stirbt. Sie tut es nicht (0,222 — praktisch
  Zufallserwartung). Sie stirbt an der **Streuung**: 0,9977 statt 0,8833 Pp, also 13 %
  schlechtere Auflösung. Die Normierung kauft Präzision, nicht Wechselhaftigkeit. Die
  vermutete Wirkung war die falsche; die Wahl bleibt trotzdem richtig.
- **G wird ausdrücklich NICHT mitgemessen.** Das Spiegelbild wäre ein billiger dritter
  Test und würde `delta80` auf 0,0429 heben — über die Aktienhürde, womit der NEIN-Zweig
  seine Schärfe verlöre. Die Literatur sagt außerdem eine **Asymmetrie** voraus
  (Boyarchenko et al.: Ausverkäufe ja, Kauftage nein). G ist der **Nachlauf**, wenn F ein
  JA liefert, nicht ein Nebenbei.

## 6. Endpunkte, Testzahl, Entscheidungsregel

**Testzahl: 2.** Zweig N (Nacht) und Zweig T (Tag). Schwelle **|t| ≥ 2,2414** (Bonferroni,
zweiseitig, α = 0,05). Tagesgeclustert, Newey-West mit H−1 = 0 Verzögerungen.
Kampagnenweite Schwelle wird **zusätzlich** ins Protokoll geschrieben (Abschnitt 8).

**Zweig T ist keine zweite Chance, sondern die Trennschärfe.** Sitzt der Effekt im Tagbein
genauso stark oder stärker, ist es gewöhnliche kurzfristige Gegenbewegung und keine Prämie
für das Halten über die Sitzungsgrenze — dann wird ein JA aus Zweig N **zurückgenommen**,
unabhängig von seinem t.

| Ausgang | Bedingung |
|---|---|
| **JA** | Zweig N: Überschuss ≥ **+0,10 Pp** je Umlauf **und** \|t\| ≥ 2,2414 **und** Zweig T trägt weniger als die Hälfte davon |
| **NEIN, Familie geschlossen** | Zweig N: \|Überschuss\| + 1,96 · se < **0,04 Pp** — beidseitig, also schließt dieser Zweig auch die Fortsetzungsrichtung |
| **FORTSETZUNG statt Umkehr** | Zweig N: Überschuss ≤ **−0,10 Pp** und \|t\| ≥ 2,2414. Kein JA für diesen Entwurf (short über Nacht ist ein anderer Handel mit anderen Kosten), aber ein **belegter Befund** zugunsten von Lou/Polk/Skouras und ein eigener Eintrag im Korpus. |
| **nicht entscheidbar** | sonst — mit Angabe, wie viele Tage für 0,04 Pp nötig wären |
| **ungültig** | der Placebo schlägt an, oder ein Gatter aus Abschnitt 7 reißt |

Die JA-Schwelle steht auf der **CFD-Hürde (0,10)**, weil ein JA auf dem Produkt handelbar
sein soll, das die App wirklich benutzt. Die NEIN-Schwelle steht auf der **Aktienhürde
(0,04)**, weil ein Ausschluss dort am meisten schließt. `delta80` = 0,0396 Pp liegt unter
beiden — **jeder Zweig ist erreichbar.**

## 7. Gatter — jedes einzeln bindend, alle vorab

1. **`ausstieg`-Schalter, und zwar an allen drei Stellen.** Zweig N verlangt Ausstieg zur
   Folge-Eröffnung. Der Schalter ist am 26.08. freigegeben (Tafel, Antwortsatz vom 26.08. **09:00**, Frage 2 — nicht zu verwechseln mit dem Abruf-Satz 1a/2b/3a vom selben Tag).
   Er muss **Signal, Kontrolltopf und Placebo zugleich** umstellen; nur den Signalpfad
   umzustellen heißt, zwei verschiedene Ausführungen zu vergleichen und den Unterschied
   Effekt zu nennen — der **C7**-Fehler, der hier schon aus t 5,96 ein t −0,75 gemacht hat.
   Zusätzlich: `eroeffnungKurs()` fällt heute beim Fehlen der Eröffnung still auf
   `bars[k−1][1]` zurück; für einen **Ausstieg** ist das unzulässig, weil es die Rendite
   mechanisch auf die Schluss-Fassung setzt. Das Signal muss dann **ausgeworfen** werden.
   Reißt dieses Gatter, ist nur Zweig T messbar und die Studie **hat kein Urteil**.
2. **Eröffnungskurs-Bereinigung (härtestes inhaltliches Gatter).** Die Studie hängt daran,
   dass Eröffnung und Schluss **derselben Zeile** gleich bereinigt sind — und hier doppelt,
   weil auch das **Signal** aus Eröffnung(i)/Schluss(i−1) gebildet wird. Sind Schlusskurse
   dividendenbereinigt und Eröffnungskurse nicht, trägt jede Übernachtgröße an Ex-Tagen
   einen systematischen Abschlag, und zwar **in Signal und Zielgröße zugleich** — das
   erzeugt einen Scheinzusammenhang, nicht nur Rauschen. Prüfung: Verteilung von
   Eröffnung(t)/Schluss(t−1) an bekannten Split- und Ex-Tagen gegen gewöhnliche Tage.
   Reißt das Gatter, **entfällt das Urteil**; die Zahl wird nicht korrigiert.
3. **#85 — laufende Kerze.** Die letzte Kerze jedes Abrufs wird verworfen. Betrifft
   nachweislich auch `archiv1d`, nicht nur 60m (gemessen 26.08.: 56 % einer 80er-Stichprobe
   hatten in der letzten Kerze unter 60 % des Median-Volumens; `stand` der Dateien
   24.08. 17:27 UTC, also mitten in der Sitzung). Beide Zählwerkzeuge dieser Nacht
   verwerfen sie bereits.
4. **Placebo mit gleicher Bauform.** Kein kursfreies Signal beliebiger Feuerdichte — der
   Placebo muss denselben Signalanteil (19,8 %) und dieselbe Querschnittsbreite je Tag
   nachbilden und **auch in der Zeit** gewürfelt werden, sonst prüft er etwas anderes.
5. **Kein Vorgriff (Gegenstück zu Gatter 3 der Schwesterstudie).** Zu prüfen ist, dass die
   Umsetzung `z1` wirklich nur aus Kursen bis `Eröffnung(i)` bildet und insbesondere **nicht**
   `Schluss(i)`, `Hoch(i)` oder `Tief(i)` berührt. Das ist der Kernvorzug dieses Entwurfs;
   geht er in der Umsetzung verloren, ist der Entwurf wertlos und keine bloß abgeschwächte
   Fassung. Testfall verlangt.
6. **Überlebensverzerrung ausgewiesen.** `archiv1d` enthält nur Überlebende. Richtung der
   Verzerrung in den Bericht; als Gegenprobe die 1.037 delisteten Reihen — die decken
   allerdings nur 2024–2026 ab und können die Bestätigungshälfte nicht ersetzen.
   **Für diesen Entwurf ist die Richtung nicht harmlos:** ausgewählt werden Werte nach
   einem scharfen Abwärtsstoß, und genau solche Werte verschwinden überproportional. Die
   Auswahl der Überlebenden ist damit die Auswahl derer, die sich erholt haben.
7. **Ären beschreibend, nicht urteilend.** Vor 2001 (Bruchpreise) getrennt ausweisen.
   Geurteilt wird ausschließlich auf der Bestätigungshälfte.
8. **Kostenzahl als unbelegt kennzeichnen.** 0,04 Pp beschreibt die *notierte Spanne*.
   Dieser Handel füllt in der **Schluss- und der Eröffnungsauktion**. Was eine
   Auktionsfüllung wirklich kostet, ist hier nie gemessen worden; die Messung ist am
   26.08. freigegeben (Tafel, Antwortsatz vom 26.08. **09:00**, Frage 3). Solange sie offen ist, steht unter jeder
   Netto-Aussage dieses Entwurfs ein Vorbehalt.

## 8. Die Testzahl der Familie — offen ausgewiesen

Dieser Entwurf und `glockendruck-nacht` messen dasselbe Fenster auf demselben Korpus. Wer
die Bonferroni-Rechnung ehrlich über die **Familie** führt, kommt auf **4 Tests**, und
damit auf `delta80` = **0,0429 Pp** — das liegt **über** der Aktienhürde von 0,04.

Was daraus folgt, und was nicht:

- Die **JA**-Schwellen beider Studien (0,10 Pp) bleiben familienweit erreichbar; 0,0429
  liegt weit darunter.
- Die **NEIN**-Aussage „Familie unterhalb der Aktienhürde geschlossen" ist familienweit
  **nicht** mehr gedeckt. Sie gilt studienweise (2 Tests) und muss so berichtet werden.
  Wer sie familienweit haben will, braucht entweder die NEIN-Schwelle auf der CFD-Hürde
  (0,10, dort ist reichlich Luft) oder mehr Tage.
- Die beiden Auswahlen überschneiden sich nur zufällig (0,190 gegen 0,198). Bonferroni ist
  hier also **konservativ**, nicht knapp — die tatsächliche Familienrate liegt unter dem
  Nennwert. Das ist ein Argument, keine Erlaubnis; gerechnet wird mit dem Nennwert.

Ich schreibe das hin, weil es sonst niemand tut und weil dieses Projekt schon einmal eine
überholte Formel („zwei validierte Kanten") durch Code, Befunde und Gedächtnis
weitergetragen hat.

## 9. Was ich mir selbst nicht durchgehen lasse

- **Der Eröffnungskurs ist die lauteste Zahl im Archiv** (Amihud/Mendelson 1987). Er steht
  hier **auf beiden Seiten**: im Signal (`Eröffnung(i)`) und in der Zielgröße
  (`Eröffnung(i+1)`). Verschiedene Tage, also kein geteilter Kurs — aber wenn die
  Eröffnungs-Notierung eines Symbols systematisch verzerrt ist (etwa dauerhaft auf dem
  Briefkurs gestellt), wirkt das in beiden. Die A7-Kontrolle zieht symboleigene
  Dauerneigungen ab und sollte genau das erwischen; belegt ist es nicht. Als Vorbehalt in
  den Bericht.
- **252 Umläufe im Jahr.** 10,1 Pp Kosten bei der Aktie, 25,2 Pp beim CFD. Ein JA bei
  0,10 Pp je Umlauf ist brutto ~25 Pp im Jahr und netto **null** auf dem CFD. Handelbar
  wäre dieser Entwurf, wenn überhaupt, auf der **Aktie** — was das Depot heute nicht
  handelt. Das ist kein Grund, ihn nicht zu messen (die obere Schranke ist der Ertrag),
  aber ein Grund, kein Handelsversprechen daran zu hängen.
- **Die Bestätigungshälfte ist immer noch dasselbe Archiv.** Faktor 15 an Auflösung kommt
  aus Haltedauer und Tagezahl, nicht aus neuen Daten. Zwei Studien auf demselben Korpus
  sind zwei Studien auf demselben Korpus.
