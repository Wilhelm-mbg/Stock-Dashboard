# 26.08.2026, zweiter Lauf (08:48) — Entwurfsnotizen

**Nacht-Typ A** (Entwurf). Warteschlange bei Beginn: **1 offener Entwurf**, also kein Stau
(Sperre greift ab 3). Die beschlossene Mess-Sperre (Neumessung der zwölf Strategien auf dem
versionierten Instrument) gilt weiter — entworfen und vorregistriert wird trotzdem.

Ergebnis: ein zweiter vorregistrierter Kandidat
(`studien/vorregistrierung-2026-08-26-nachtstoss-umkehr/`), **zwei selbst verworfene
Fassungen**, ein **Konstruktionsfund an der eigenen Schwesterstudie**, zwei neue
Zählwerkzeuge. Kein neuer Auftragsvorschlag — beide Vorschläge des ersten Laufs sind
inzwischen von Wilhelm freigegeben (Tafel 09:00, Antworten 2a und 3a), und der Kandidat
dieser Nacht kommt mit denselben Vorbedingungen aus.

**Firecrawl: 0 von 5 erlaubten Suchen verbraucht.** Die Richtungsfrage (Umkehr oder
Fortsetzung) beantwortet das Dossier vom 02:36 bereits, es deckt dieselbe Familie ab.
Eine zweite Recherche zur selben Frage wäre Ausstoß gewesen, kein Erkenntnisgewinn.

---

## 1. Warum überhaupt ein zweiter Entwurf im selben Fenster

Der erste Lauf hat nicht einen Detektor gefunden, sondern **ein Fenster**: über Nacht,
H = 1, `archiv1d` seit 1986 — und dort ist `delta80` rund **Faktor 15 kleiner** als im
Korpus-Median. Ein Fenster, in dem das Lineal erstmals kleiner ist als das gesuchte Objekt,
verdient mehr als einen Schuss. Die Frage war nur: gibt es einen **zweiten, unabhängigen**
Schuss, oder wäre das dieselbe Sache mit anderem Namen?

Gezählt (`zaehle-nachtstoss.js`, Feld `ueberschneidung_mit_B`): Die Auswahl des neuen
Kandidaten überschneidet sich mit der Auswahl des Schlussdrucks an **0,190** ihrer
Symbol-Tage. Die Zufallserwartung bei zwei unabhängigen Quintilen desselben Querschnitts
ist **0,198**. Also: **keine** Überschneidung über den Zufall hinaus. Zwei Schüsse.

## 2. Der eigentliche Fund der Nacht — die Schwesterstudie hat einen geteilten Kurs

Beim Aufschreiben der Kandidatenliste ist mir aufgefallen, was ich in der Vornacht
übersehen habe.

Zielgröße ist `Eröffnung(i+1) / Schluss(i) − 1`.
Der Schlussdruck ist `S = (Schluss(i) − Tief(i)) / (Hoch(i) − Tief(i))`.

**`Schluss(i)` steht in beiden — mit entgegengesetztem Vorzeichen.** Ein Schluss, dessen
letzter Druck auf dem Geldkurs steht, senkt `S` *und* hebt die gemessene Übernachtrendite.
Das ist die klassische Spannen-Umkehr, und sie zeigt in **genau die Richtung, die
`glockendruck-nacht` behauptet**. Ein Scheineffekt, der wie der gesuchte Effekt aussieht.

Gezählt (`zaehle-spannenrueckprall.js`, 400 Symbole, 9.499 Tage, unterstes `S`-Quintil):

| Größe | Wert |
|---|---|
| Schluss **exakt** auf dem Tagestief | **6,4 %** der ausgewählten Tage |
| `S` < 0,05 | **23,1 %** |
| `S`-Median der Auswahl | 0,124 |
| Tagesspanne, Median | 2,52 Pp (Korb 2,30 Pp) |

Die halbe notierte Spanne liegt bei ~0,02 Pp. Ein knappes Viertel der Auswahl schließt
praktisch auf dem Tief, und die Auswahlregel ist ihrer Natur nach zum Geldkurs geneigt —
nicht zufällig verteilt.

**Was das für die Schwesterstudie heißt, genau und ohne Dramatisierung:**

- **JA-Seite (≥ 0,10 Pp): hält.** 0,02 Pp sind höchstens ein Fünftel der Schwelle.
- **NEIN-Seite: hält nicht.** Der Abstand zwischen `delta80` (0,0397) und der Aktienhürde
  (0,04) beträgt **0,0005 Pp**. Ein Rückprall-Beitrag von wenigen Tausendstel Pp
  beherrscht diese Marge um ein Vielfaches. Die Aussage „das Sitzungsgrenzen-Fenster ist
  über 40 Jahre unterhalb von 0,04 Pp geschlossen" — die schärfste obere Schranke, die
  das Projekt je gehabt hätte — ist **nicht rückprall-fest**, solange sie am Schlussdruck
  hängt.

Ich habe die Vorregistrierung der Schwesterstudie **nicht angefasst** (eine
Vorregistrierung wird nicht nachträglich umgeschrieben) und stattdessen einen datierten
Nachtrag daneben gelegt:
`studien/vorregistrierung-2026-08-26-glockendruck-nacht/NACHTRAG-2026-08-26-spannenrueckprall.md`.

**Das ist der Grund, warum dieser Entwurf existiert.** Er teilt mit der Zielgröße keinen
einzigen Kurs.

## 3. Der Kandidat

`O(t) = Eröffnung(t)/Schluss(t−1) − 1`; `z1(i) = O(i) / sd(O über i−59 … i−1)`;
unterstes Quintil, long, Einstieg `Schluss(i)`, Ausstieg `Eröffnung(i+1)`.

| | Signal liest | Zielgröße liest |
|---|---|---|
| `glockendruck-nacht` | Hoch(i), Tief(i), **Schluss(i)** | **Schluss(i)**, Eröffnung(i+1) |
| **`nachtstoss-umkehr`** | Schluss(i−1), **Eröffnung(i)** | Schluss(i), Eröffnung(i+1) |

Zwei Vorzüge, beide strukturell und nicht durch Feinschliff erreichbar:

1. **Disjunkte Kurse** → kein Spannen-Rückprall.
2. **Kein C8-Vorgriff.** `z1(i)` steht um 09:31 fest; der Einstieg liegt zu `Schluss(i)`.
   Über sechs Stunden dazwischen. `glockendruck-nacht` muss `S` beim Auftrag raten und
   deshalb als **obere Schranke** gemeldet werden — hier entfällt der Vorbehalt ersatzlos.

Bei praktisch gleicher Auflösung: `delta80` **0,0396** gegen 0,0397 Pp.

**Mechanismus.** Die Eröffnungsauktion hat die dünnste Beteiligung des Tages und wickelt
zugleich den meisten terminfixen Fluss ab (MOO, über Nacht eingestellte Privatanleger-
Orders, Nachbildung). Wer die Gegenseite stellt, verlangt ein Zugeständnis; ein Teil des
Eröffnungskurses ist Druck, nicht Wert. Die Frage ist, **wann** er zurückgezahlt wird —
innertags (dann sammelt Innertags-Kapital ihn ein, keine Prämie) oder in der nächsten
Nacht (dann muss jemand unbewirtschaftet halten, also Risikoprämie). Genau das trennen
Zweig N und Zweig T.

**Richtung begründet, nicht geraten** (Dossier vom 02:36): Lou/Polk/Skouras 2019 finden das
Kurzfrist-Umkehr-Alpha im **Nachtbein** (+0,93 %/Monat, t = 4,28) und negativ im Tagbein
(−1,05 %, t = −3,25). Boyarchenko/Larsen/Whelan 2023 berichten die Asymmetrie: **nach
Ausverkäufen** robuste Übernacht-Umkehr, nach Kauftagen nicht — deshalb wird die
Runter-Seite geprüft und nicht das Spiegelbild. Die Gegenthese (Fortsetzung der
Übernachtrendite im eigenen Fenster, ebenfalls Lou/Polk/Skouras) steht als **eigener
vorregistrierter Ausgang** in der Entscheidungstabelle, damit sie hinterher niemand
umdeuten muss.

## 4. Zwei verworfene Fassungen — und bei einer lag ich falsch

Vier Fassungen wurden gezählt und **ohne Ertragsblick** verglichen:

| Fassung | Beharrlichkeit (Zufall 0,198) | σ (Pp) | `delta80` (2 T.) | Urteil |
|---|---|---|---|---|
| **F `z1` runter** | **0,217** | **0,8833** | **0,0396** | **gewählt** |
| G `z1` hoch (Spiegel) | 0,229 | 0,8849 | 0,0396 | Nachlauf, nicht mitgemessen |
| H `z3` über drei Nächte | **0,561** | 0,8892 | 0,0398 | **verworfen** |
| I `O(i)` ohne Normierung | 0,222 | 0,9977 | 0,0447 | verworfen |

- **H ist der Fehler der Vornacht in klein.** Drei Nächte zu addieren macht aus einer
  wechselnden Bedingung wieder eine **Symbolneigung** (0,561 gegen 0,198 Zufall). Dieselbe
  Todesursache wie beim Kandidaten `V` (0,943), nur langsamer. Das bestätigt den neuen
  Fehlerkatalog-Eintrag ein zweites Mal, an einem Fall, den ich für harmlos gehalten hätte.
- **Bei I war meine Begründung falsch, und das gehört ins Protokoll.** Ich hatte erwartet,
  die unnormierte Fassung wähle dauerhaft die schwankungsfreudigen Symbole und sterbe an
  der Beharrlichkeit. Tut sie nicht — 0,222, praktisch Zufallserwartung. Sie stirbt an der
  **Streuung** (0,9977 statt 0,8833 Pp, 13 % schlechtere Auflösung). Die Normierung kauft
  **Präzision, nicht Wechselhaftigkeit.** Vorhersage falsch, Wahl trotzdem richtig — und
  ich hätte die falsche Begründung ungeprüft in die Vorregistrierung geschrieben, wenn der
  Zähllauf sie nicht widerlegt hätte. Deshalb wird gezählt und nicht argumentiert.
- **G wird nicht mitgemessen**, obwohl es verlockend wäre: ein dritter Test hebt `delta80`
  auf 0,0429 — **über die Aktienhürde**, womit der NEIN-Zweig seine Schärfe verlöre.
  Die Literatur sagt ohnehin Asymmetrie voraus. G ist Nachlauf bei einem JA.

## 5. Die Testzahl der Familie, offen ausgewiesen

Zwei Studien, dasselbe Fenster, derselbe Korpus. Familienweit sind das **4 Tests** und
damit `delta80` = **0,0429 Pp** — **über** der Aktienhürde von 0,04.

- Die **JA**-Schwellen (0,10 Pp) bleiben familienweit locker erreichbar.
- Die **NEIN**-Aussage „unterhalb der Aktienhürde geschlossen" ist familienweit **nicht**
  gedeckt. Sie gilt studienweise und muss so berichtet werden.
- Bonferroni ist hier konservativ (die Auswahlen sind unabhängig, Überschneidung 0,190
  gegen 0,198 Zufall). Das ist ein Argument, keine Erlaubnis — gerechnet wird mit dem
  Nennwert.

Ich schreibe das hin, weil es sonst niemand tut. Dieses Projekt hat schon einmal eine
überholte Formel („zwei validierte Kanten") durch Code, Befunde und Gedächtnis
weitergetragen, und der Weg dorthin führt immer über eine Zahl, die niemand ungefragt
nachrechnet.

## 6. Was gezählt wurde, und was ausdrücklich nicht

Zwei neue Werkzeuge unter `studien/tueftler/werkzeug/`:

- `zaehle-nachtstoss.js` — Beharrlichkeit, Streuung, Breite, Umsatz und
  **Überschneidung mit der Schwesterauswahl** für fünf Fassungen. Die Tagesmittel entstehen
  rechnerisch (ohne sie gibt es keine Streuung), verlassen aber die Funktion nicht: **kein
  Ertragsmittelwert wird gedruckt oder abgelegt.**
- `zaehle-spannenrueckprall.js` — reine Abzählung, wie oft der Schluss der ausgewählten
  Tage auf dem Tagestief druckt. Keine Rendite wird darin überhaupt gemittelt.

Rohausgaben: `daten/zaehlung-nachtstoss-2026-08-26.json`,
`daten/zaehlung-spannenrueckprall-2026-08-26.json`.

Beide verwerfen die letzte Kerze (#85) und benutzen `reiheKaputt` wie die Messmaschine.
An App-, Messmaschinen- oder Testcode wurde nichts angefasst; die Sperre auf
`studien/messmaschine/messmaschine.js` ist unberührt.

## 7. Offen geblieben

- **Zweig T braucht die Eröffnung als Einstieg, Zweig N als Ausstieg.** Beides hängt am
  `ausstieg`-Schalter (freigegeben, in Arbeit auf eigenem Zweig). Ohne ihn ist auch dieser
  Kandidat nur halb messbar — dieselbe Vorbedingung wie bei der Schwesterstudie, also
  **keine zusätzliche Bauarbeit.**
- **Auktionskosten** bleiben der Vorbehalt unter jeder Netto-Aussage beider Studien
  (freigegeben am 26.08., Antwort 3a).
- Die **Überlebensverzerrung** ist bei diesem Entwurf nicht richtungsneutral: ausgewählt
  wird nach scharfem Abwärtsstoß, und genau solche Werte verschwinden überproportional.
  Steht als Gatter 6 drin; die 1.037 delisteten Reihen decken nur 2024–2026 und können
  die Bestätigungshälfte nicht ersetzen.
