<!-- PM-STAND
letzter-bericht: 2026-08-26 00:30
gesehener-tag: v8.33.2
-->

# Projektstand

**Diese Tafel schreibt der Projekt-Manager, nicht du.** Sie ist der Kanal zwischen Wilhelm
und den Sitzungen: hier steht, was entschieden ist, was gerade läuft und was als Nächstes
ansteht. Lies sie beim Start; trag dich unter „Läuft gerade" ein, wenn du Dateien belegst.

Wenn du hier etwas änderst, dann nur deine eigene Zeile unter „Läuft gerade".

---

## Stand: 26.08.2026, 00:30

Ausgeliefert ist **v8.33.2**. Arbeitsbaum sauber, nichts Ungepushtes, alle Tests grün.
Eine Release-Notiz wartet auf die Wache (`2026-08-26-belegt-heisst-bestaetigt.md`).

Der Struktur-Plan vom 25.08. (`studien/struktur-plan-2026-08-25/PLAN.md`):

| Stufe | Inhalt | Stand |
|---|---|---|
| A | Politur, Sammelzeilen, Leerzustände, Kleintexte | fertig |
| B | Navigation gehört der Shell | fertig |
| C | Mittelfrist, Meine Papiere, Marktkarte als Pille | fertig |
| D | Bausteinkasten, Info-Register | fertig |
| E | `depot.js` zerlegen — sieben Blöcke | fertig (9.972 → 6.988 Zeilen) |
| E-Rest | `init()` dritteln, Speicher-Nebeneffekt aus `render()` | **fertig** (25./26.08.) |
| F | Ein Chart-Renderer, Barrierefreiheit, Theme ohne Blitz | **offen** |

Damit ist vom Struktur-Plan nur noch Stufe F offen.

---

## Aufträge

*Was freigegeben ist und noch niemand macht. Wer eine Zeile nimmt, trägt sich unter
„Läuft gerade" ein und streicht sie hier.*

**Erledigt 26.08.:** ~~#83 / #89 — „Meine Papiere“ ganz nach Vermögen.~~ `79a505b`,
beide Meldungen geschlossen. Der Signalstand ist als zwei Spalten mitgezogen; Felix’
Gruppierung aus #71 kommt bewusst nicht mit (Begründung im Commit und in #83).

**Dann — Vorstufen der Neumessung (Messwerkzeug, keine Handelslogik). Wilhelm 26.08.:
alle vier zuerst, die Neumessung startet erst danach.**

- ~~**#85** — laufende Quote-Stempel-Kerze abschneiden.~~ **Erledigt 26.08.** (`4e36674`):
  beide Archive verwerfen den unfertigen Balken, 2.841 vorhandene Teilkerzen entfernt.
  **Damit ist 1 von 4 Vorstufen fertig.**
- ~~**#86** — `aussicht` (Tage bis t=2) feuert nie.~~ **Erledigt 26.08.** (`ade84ec`):
  in 59 abgelegten Urteilen stand die Zahl auf null. Gegenprobe des Analytikers meldet
  jetzt 2 von 2 statt 0 von 2.
- ~~**#87** — A7-Protokolltext nennt das falsche Ausschlussfenster.~~ **Erledigt 26.08.**
- ~~**#88** — Placebo-Lauf ignoriert die Einstiegskonvention.~~ **Erledigt 26.08.**:
  gemessen −0,5000 Pp gegen MDE 0,0055 Pp, nach der Reparatur 0,0000. Kein abgelegtes
  Protokoll war betroffen. Damit ist `glockendruck-nacht` Zweig T an dieser Stelle frei.

> **ALLE VIER VORSTUFEN SIND FERTIG (26.08.).** Die Neumessung ist damit nicht mehr
> blockiert. Sie beginnt laut Auftrag mit der Versionierung der Messmaschine — und die
> ist durch #86/#87 dringender geworden: die Protokollinhalte ändern sich (`aussicht`
> wird gefüllt, A7-Text anders), die Version steht weiter auf `1.0.0`.

**Danach — Messmaschine versionieren und alle Kanten neu messen** (freigegeben 25.08. spät):
(1) Versionsnummer der Messmaschine an ihren Code koppeln (heute 7 Änderungen bei
unverändert „1.0.0") und veraltete Protokolle in der Übersichtstafel kennzeichnen;
(2) danach alle zwölf Strategien einmal auf dem aktuellen Instrumenten-Stand neu messen.
Erst dann neue Untersuchungen.

**Danach — Nachtaufträge Wilhelms vom 26.08.:**

- **Großer Archiv-Ausbau:** Backfill 60m und täglich auf E:, Universum nach Wertpapierart
  verbreitern. Ausdrücklich NACH der Neumessung, damit die zwölf Protokolle auf einem
  festen Archivstand messen.
- **Literatur-Tiefenrecherche** Übernacht-/Schlussauktions-Effekte (einmaliger Lauf 02:30,
  Ergebnis nach `studien/tueftler/recherche-2026-08-26/`).

**Oberfläche, parallel möglich:**

- **Stufe F, Reihenfolge fest:** (1) Theme ohne Dunkel-Blitz beim Start, (2) ein einziger
  Chart-Renderer (`drawBig` vs. `chart.js` — Entscheid nach Funktionsvergleich),
  (3) Barrierefreiheit (Rest #59 Stufe 3). Je eigenes Vorhaben, je eigene Release-Notiz.
- **Nachbilden-Dialog:** Belegstatus sichtbar in den Dialog „Trade nachbilden" —
  Belegtexte aus den Protokollen (`DepotAPI.protokollKante`), nie aus Prosa.
- **Handel raus aus dem Renderer — NUR PLAN:** ein Umbauplan als Dokument unter
  `studien/`, kein Code. Gebaut wird erst nach Wilhelms zweitem Ja.
- **#80 Kanal-Güte neu eichen:** Studien-Strang. Bis die Eichung steht, bekommt die
  Güte-Zahl in der Oberfläche einen Warnhinweis („ungeeicht").
- **rsi2seit-mcp V4: Bestätigungsmessung vorregistrieren** (Studien-Strang). Ehrlicher
  Rahmen: Intervall [+0,018, +0,117] gegen Hürde 0,10 — läuft, sobald genug frische Tage da sind.
- **Zweig `claude/dashboard-integrated-browser-plvkv7` prüfen** (1 Commit: Browser-Treiber,
  Aufzeichnung, Einzeldatei) und bei Tauglichkeit einbauen; sonst mit Begründung vorlegen.
- **Danach die kleinen Wünsche, Reihenfolge fest:** #69 lokales Backup → #82 Herkunftsland-
  Filter Marktkarte → #70 Radar-Streusuchen → #33 zweiter Trendwende-Detektor.

---

## Läuft gerade

*Wer welche Dateien belegt. Trag dich ein, bevor du anfängst; nimm dich raus, wenn du
fertig bist.*

- **App-Codebase Master** — hat **Messmaschine versionieren** genommen (26.08., Teil 1
  des Neumessungs-Auftrags): Versionsnummer an den Code koppeln, veraltete Protokolle in
  der Übersichtstafel kennzeichnen. Belegt `studien/messmaschine/`. **Das Neumessen der
  zwölf Strategien (Teil 2) nimmt jemand anders** — langer Rechenlauf, kein Umbau.
  Zuletzt fertig: #76, #84, #85, #83/#89, #86/#87/#88.

---

## Entschieden

*Entscheidungen von Wilhelm, mit Datum. Eine Entscheidung, die nur in einem Chatverlauf
steht, ist nach zwei Stunden verloren.*

- **26.08.2026, ~01:45 — die Issue-Wache ist zurück, aber als TRIAGE.** Sie war
  unbemerkt aus der Aufgabenliste verschwunden (mindestens zum zweiten Mal); #83 und #89
  lagen deshalb über vier Stunden unbeachtet. Wilhelm wollte sie in der Cloud neu anlegen
  und an „neues Issue" binden. **Das ist nicht baubar:** die Schnittstelle verlangt eine
  Cloud-Umgebung (`ccr.environment_id`), die an das Repo gebunden ist; auf diesem Rechner
  ist keine hinterlegt, und einrichten kann sie nur Wilhelm selbst. Er hat entschieden,
  **das vorerst zu lassen**. Stattdessen läuft sie wieder **lokal alle 30 Minuten**.
  **Wichtige Änderung gegenüber der alten Fassung:** sie **baut nichts und liefert nichts
  aus**. Sie sichtet, ordnet ein, antwortet freundlich auf Deutsch und lässt Issues offen;
  schließen darf sie nur nachweislich Erledigtes und exakte Doppel. Grund: die alte
  Fassung durfte selbst releasen und stand damit gegen die Regel vom 25.08. („Versionen
  gehören der Release-Wache") — bei zehn parallelen Sitzungen im selben Arbeitsbaum ist
  das der Zusammenstoß vom 23.08. Sie schreibt auch **nicht** auf diese Tafel; die
  gehört dem PM, der die Issues ohnehin bei jedem Lauf liest.
- **26.08.2026, ~01:45** — Neue Aufgabe **`projekt-manager-abruf`**, „nur von Hand".
  Damit kann Wilhelm einen Projektstand abrufen, wann er will, statt auf den nächsten
  Termin zu warten. Sie berichtet nur und **schreibt die Tafel nicht neu** — einzige
  Ausnahme: trifft Wilhelm dabei eine Entscheidung, trägt sie diese unter „Entschieden"
  ein und gibt sie an die laufenden Sitzungen weiter.
- **26.08.2026, ~01:15** — *#83 und #89 widersprachen sich: bleibt unter „Heute" etwas von
  „Meine Papiere" stehen?* → **(b) Unter „Heute" verschwindet der Abschnitt ganz.** Damit
  gilt #89 vor #83. Der PM hatte (a) empfohlen (kleine Liste bleibt); Wilhelm hat anders
  entschieden. **Folge, die mitentschieden ist:** das überschreibt Felix' Wunsch #71
  („Signalstand prominent auf Heute") — der Signalstand zieht deshalb in die Vermögen-
  Tabelle um, statt ersatzlos zu verschwinden. Einzelheiten unter „Aufträge".
- **26.08.2026** — #85 erledigt (Vorstufe 1 von 4). Beide Archive geprueft: 60m
  gereinigt (2.841 Teilkerzen), 1d heilt sich beim naechsten Abruf selbst. Es bleiben
  #86, #87, #88 vor der Neumessung.
- **26.08.2026** — #84-Rest erledigt: alle 21 Kommentare umgeschrieben, Sperrklinke
  deckt jetzt auch Kommentare ab. Bewiesen, dass sich kein Verhalten geaendert hat.
- **26.08.2026, 00:45 (drei Antworten)** —
  (1) *Wohin mit #83/#89 („Meine Papiere" nach Vermögen)?* → **sofort erledigen**, nicht
  hinter die Neumessung stellen.
  (2) *Die „belegt"-Formel in 21 Quellcode-Kommentaren?* → **alle 21 umschreiben.** Der
  PM hatte „stehen lassen, Zeile in CLAUDE.md" empfohlen (die Kommentare tragen Geschichte);
  Wilhelm hat anders entschieden. Umschreiben heißt: die Behauptung entfernen, den
  historischen Bezug erhalten („die Inventur vom 21.08. fand …" bleibt lesbar, nur ohne
  das Wort „belegt" als Urteil). Reine Kommentaränderung, kein Verhalten.
  (3) *Neumessung: alle vier Vorstufen abwarten oder früher starten?* → **alle vier
  (#85–#88) zuerst.** Erst wenn die Instrumente stimmen, wird gemessen.
- **26.08.2026** — #84 erledigt: sieben sichtbare Texte auf „gemessen" gezogen, vierte
  Sperrklinke gesetzt.
- **25.08.2026 (spät)** — Geheimnis `TELEMETRIE_JSON` angelegt. Automatisch gebaute
  Pakete tragen den Diagnose-Rückkanal ab dem nächsten Release. Issue #76 damit
  vollständig erledigt.
- **25.08.2026** — Stufe C des Struktur-Plans wird gebaut, einschließlich Marktkarte als
  Pille unter „Heute".
- **25.08.2026** — Stufe D Punkt 6 (Erklärtexte ins Info-Register) wird gebaut; das
  Diagnose-Banner kommt auf das Dialog-Muster, **kein** Onboarding.
- **25.08.2026** — Kommerzielles und Mehrbenutzer sind vorerst kein Thema. Das Werkzeug
  ist für Wilhelm allein; Schwerpunkt sind Werkzeuge, Bedienbarkeit, Optik und ein
  vollständiger Marktüberblick.
- **25.08.2026 (spät)** — Messmaschine wird versioniert, alle zwölf Strategien werden auf
  dem aktuellen Stand neu gemessen; erst danach neue Untersuchungen.
- **25.08.2026 (spät)** — Neue Rolle **Strategie-Tüftler**: läuft jede Nacht 04:30; bei
  ≥3 wartenden Entwürfen arbeitet er stattdessen am Datenbestand. Entwirft Kandidaten mit
  Machbarkeits-Check gegen die Auflösungswand, vorregistriert, erweitert Daten; misst NIE
  selbst. Übergabe über `studien/tueftler/WARTESCHLANGE.md`.
- **25.08.2026 (spät)** — Neue Rolle **Analytiker**: läuft jede Nacht 03:15, prüft alles,
  meldet per Issue nur bei Fund, sonst eine Zeile hier auf der Tafel.
- **25.08.2026 (abends, 9 Antworten auf einmal)** — E-Rest: ja, jetzt. Stufe F: alle drei,
  Reihenfolge Theme → Chart → Barrierefreiheit. Nachbilden-Dialog: Belegstatus rein.
  Handel-aus-Renderer: erst Plan, Bau nur mit zweitem Ja. #80: neu eichen, solange
  Warnhinweis. V4: Bestätigungsmessung vorregistrieren. Browser-Zweig: prüfen und
  einbauen. #71/#78/#81: geschlossen. Wünsche: #69 → #82 → #70 → #33.
- **25.08.2026** — Der Projekt-Manager darf Unstrittiges selbst zuteilen; alles, was die
  Handelslogik berührt, neu ist oder Geld kostet, wird vorgelegt.

---

## Wartet auf Wilhelm

*Fragen, an denen Arbeit hängt.*

- **Zweites Ja zum Handel-aus-Renderer-Umbau** — fällig, sobald der Plan als Dokument vorliegt.

---

## Analytiker

*Eine Zeile je Nacht, geschrieben von der Analytiker-Aufgabe (03:15). Issues nur bei Fund.*

- **26.08.** — Erster Lauf: A–C, E + D geprüft; Placebo sauber (t −0,10), Live = Messung bestätigt, keine frischen Tage für Kanten-Neuberechnung; 2 Funde gemeldet (#84 „belegt"-Prosa, #85 laufende Quote-Stempel-Kerze im 60m-Archiv), Details in `studien/analytiker/2026-08-26/BEFUND.md`; nächste Nacht F-Rotation Punkt 1 (Kontrollgruppen-Konstruktion / A7-Lesefenster).
- **26.08. (2. Lauf, 23:36)** — A–C, E verkürzt (nichts geändert seit dem ersten Lauf) + F-Rotation Punkt 1: **A7-Konstruktion trägt** (Ausschnitt-Arithmetik exakt gegen Brute-Force, Nullpunkt auf Kunstarchiv mit Selektions-Köder im Rahmen); 3 Funde gemeldet (#86 `aussicht` feuert nie, #87 A7-Protokolltext nennt falsches Fenster, #88 Placebo ignoriert Einstiegskonvention), Details in `studien/analytiker/2026-08-26-zweiter-lauf/BEFUND.md`; nächste Nacht F-Rotation Punkt 2 (Signifikanz-Rechnung/Testzahl, dabei Newey-West-Verzögerung Tage-gegen-Kerzen nachrechnen).

---

## Tüftler

*Eine Zeile je Nacht, geschrieben von der Strategie-Tüftler-Aufgabe (04:30). Übergaben
stehen in `studien/tueftler/WARTESCHLANGE.md`.*

- **26.08.** — Nacht-Typ A (Entwurf), Warteschlange war leer. Entstanden: `glockendruck-nacht`
  vorregistriert (`studien/vorregistrierung-2026-08-26-glockendruck-nacht/`) — Schlussdruck
  `(Schluss−Tief)/(Hoch−Tief)`, unterstes Quintil, long über Nacht auf `archiv1d`. Der Fund
  ist die Auflösung, nicht die These: **`delta80` = 0,0397 Pp gegen einen Korpus-Median von
  0,605** (Faktor 15,2), weil H = 1 keine Überlappung hat und das Tagesarchiv 4.665
  Bestätigungstage trägt statt 361 — beide Zweige (JA ≥ 0,10 / NEIN < 0,04) sind erreichbar.
  Der erste Entwurf der Nacht wurde **selbst verworfen** (Beharrlichkeit 0,943 gegen Zufall
  0,198: ein fast festes Symbolmerkmal, das A7 per Konstruktion wegkürzt) — daraus ein
  Vorschlag für `FEHLERTYPEN.md`. Nebenbei gemessen: **#85 betrifft auch `archiv1d`** (56 %
  einer 80er-Stichprobe, AAPL 15,0 statt 46,8 Mio Stück). Warteschlange: 1 Entwurf,
  2 Auftragsvorschläge (`ausstieg`-Schalter der Maschine als Vorbedingung; Auktionskosten
  am Demo-Konto). Keine Messung, kein Maschinencode, 0 von 5 Web-Suchen verbraucht.

---

## Auditor

*Eine Zeile je Nacht, geschrieben von der Auditor-Aufgabe (01:00). Sie prüft die **Oberfläche** —
funktional und optisch —, nicht die Messungen; sie repariert nichts. Issue nur bei Fund (A/B).*

- **26.08.** — Erster Lauf, deshalb volle Grundprüfung über alle fünf Reiter und 16 Pillen in zwei Fenstergrößen (Änderungsmenge: 7 Tage, 405 Commits). `npm test` **rot (6)** — aber vollständig aus der offenen fremden Arbeit an `bestandui.js`/`index.html` (Signalliste raus aus „Heute", Sperrklinken noch nicht nachgezogen); `eslint` allein grün, `ui-probe` **grün**, vertiefte Probe 0 unbehandelte Fehler. **1 B-Fund gemeldet (#90):** das News-Laufband steht unter `prefers-reduced-motion` still und zeigt dauerhaft nur 3 von 6 Schlagzeilen (Spur 5367 px in 1230 px Rahmen, `overflow:hidden`, kein Rollbalken) — und die Einstellung ist auf diesem Rechner **ohne Emulation aktiv**, das Band ist im echten Betrieb tot. 0 A-Funde, 3 C (Umbrüche im Trendfinder und bei „Max. offene Positionen", eine Umschrift „ueber" in den Radar-Daten). Barrierefreiheit: 0 Knöpfe ohne zugänglichen Namen, die Null durch Gegenprobe abgesichert. Details in `studien/auditor/2026-08-26/BEFUND.md`; nächste Nacht Rotationspunkt **depot**.

---

## Was nicht angefasst wird

Gilt unabhängig von dieser Tafel und steht ausführlich in `CLAUDE.md`:

- **Handelslogik** — `intradayScan`, Autopilot- und Edge-Ring, `SETUPS`, `modeParams`,
  Gates, die `window.confirm`-Gatter vor `takt()` und der Demo-Order. Nur mit eigenem,
  abgesprochenem Auftrag.
- **Versionen und Releases** — die vergibt die Release-Wache, keine Sitzung.
- **`telemetrie.json`** wird nie committet. `git clean -xdf` wird nie ausgeführt.
