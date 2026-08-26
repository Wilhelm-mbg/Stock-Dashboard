<!-- PM-STAND
letzter-bericht: 2026-08-26 08:10
gesehener-tag: v8.33.2
-->

# Projektstand

**Diese Tafel schreibt der Projekt-Manager, nicht du.** Sie ist der Kanal zwischen Wilhelm
und den Sitzungen: hier steht, was entschieden ist, was gerade läuft und was als Nächstes
ansteht. Lies sie beim Start; trag dich unter „Läuft gerade" ein, wenn du Dateien belegst.

Wenn du hier etwas änderst, dann nur deine eigene Zeile unter „Läuft gerade".

---

## Stand: 26.08.2026, 08:10

Ausgeliefert ist **v8.33.2** — unverändert seit gestern Abend. Der Quellstand ist neun
Commits weiter; **sieben Release-Notizen warten** auf die Wache. Arbeitsbaum sauber,
nichts Ungepusht.

**Die Tests sind rot** (siehe Aufträge) — seit 03:27, aus einer Studien-Datei, nicht aus
dem Programm.

Seit 03:27 hat niemand mehr etwas committet. Der große freigegebene Auftrag — die
**Neumessung aller zwölf Strategien** — liegt seit 01:40 unangetastet.

Der Struktur-Plan vom 25.08. (`studien/struktur-plan-2026-08-25/PLAN.md`):

| Stufe | Inhalt | Stand |
|---|---|---|
| A–E, E-Rest | Politur, Navigation, Reiter, Bausteinkasten, `depot.js` zerlegen | fertig |
| F (1) | Theme ohne Dunkel-Blitz | **fertig** (26.08.) |
| F (2) | Ein einziger Chart-Renderer | offen, frei |
| F (3) | Barrierefreiheit | offen, nach (2) |

---

## Aufträge

*Was freigegeben ist und noch niemand macht. Wer eine Zeile nimmt, trägt sich unter
„Läuft gerade" ein und streicht sie hier.*

### SOFORT — rote Tests (PM zugeteilt 26.08. 08:10)

`npm test` scheitert an `studien/analytiker/2026-08-26-dritter-lauf/f2-signifikanz.js`
Zeilen 26 und 30: `no-loss-of-precision`. Es sind die Lanczos-Koeffizienten der
Gammafunktion — die Zahlen sind absichtlich so lang, aber JavaScript rundet sie ohnehin.
Kürzen auf die darstellbare Genauigkeit oder die Regel für diese eine Datei ausnehmen;
das Ergebnis des Laufs darf sich nicht ändern (die Selbstkontrolle in der Datei muss
weiter |Abw| ≤ 4,3e−14 melden). **Blockiert CI für jeden Push.**

### SOFORT — #91, fünfte Vorstufe der Neumessung (PM zugeteilt 26.08. 08:10)

Der Analytiker hat in derselben Nacht einen fünften Instrumentenfehler gefunden, der
**genau die Zahlen betrifft, die die Neumessung erzeugen wird**:
`messmaschine.js:1169` rechnet `aussicht.tage80` gegen t=2, entschieden wird aber gegen
die Bonferroni-Schwelle. Bei 16 von 21 Protokollen (tests>1) untertreibt die Zahl die
nötigen Tage um 21–59 %. Reparatur ist eine Zeile: `schwelle` statt `VERFAHREN.zAlpha`.
Brisant, weil #86 die `aussicht` gerade erst zum Feuern gebracht hat.
**Diese Reparatur gehört VOR die Neumessung** — sonst tragen alle zwölf frischen
Protokolle eine zu optimistische Planungszahl.
Sperrklinke der Messmaschine beachten: der `codeStand` ändert sich, es ist aber
**keine** Verfahrensänderung (nur eine Planungszahl) — Version bleibt 1.1.0.

### SOFORT — #90, totes News-Laufband (PM zugeteilt 26.08. 08:10)

Auditor-Fund der Nacht: das News-Laufband steht bei „Bewegung reduzieren" still und
zeigt dann nur die Hälfte. **Kein Randfall** — auf Wilhelms Rechner ist „Bewegung
reduzieren" dauerhaft aktiv (am 26.08. gemessen), das ist also sein Normalzustand.
Reparatur: bei reduzierter Bewegung nicht scrollen, sondern alle Meldungen zeigen.

### DANN — Neumessung aller zwölf Strategien (freigegeben 25.08., frei seit 01:40)

**Immer noch niemand dran.** Alle Vorbedingungen sind erfüllt (#85–#88 repariert,
Maschine versioniert auf 1.1.0 mit `codeStand`); es fehlt nur noch #91 oben.
Das ist **ein langer Rechenlauf, kein Umbau** — es braucht eine Sitzung mit Zeit, nicht
eine, die Code anfasst. Danach tragen die Protokolle einen echten Stand statt
„unbekannt" (26 alte Protokolle stehen heute ohne Kennung da). **Erst danach neue
Untersuchungen.**

### Wartet auf Wilhelm (nicht anfangen)

- **`ausstieg`-Schalter in der Messmaschine** (Auftragsvorschlag A des Tüftlers).
  Vorbedingung für den Studien-Kandidaten `glockendruck-nacht`. PM-Frage 2 vom 26.08.
- **Auktionskosten am Demo-Konto messen** (Auftragsvorschlag B). PM-Frage 3 vom 26.08.
- **Release** — gehört der Release-Wache, die nur von Hand läuft. PM-Frage 1 vom 26.08.

### Danach — schon freigegeben, Reihenfolge fest

- **Großer Archiv-Ausbau:** Backfill 60m und täglich auf E:, Universum nach
  Wertpapierart verbreitern. Ausdrücklich NACH der Neumessung.
- **Stufe F (2)** — ein einziger Chart-Renderer (`drawBig` vs. `chart.js`, Entscheid
  nach Funktionsvergleich). **Frei, parallel möglich.**
- **Stufe F (3)** — Barrierefreiheit (Rest #59 Stufe 3), nach (2).
- **Nachbilden-Dialog:** Belegstatus sichtbar im Dialog „Trade nachbilden" —
  Belegtexte aus den Protokollen (`DepotAPI.protokollKante`), nie aus Prosa.
- **Handel raus aus dem Renderer — NUR PLAN:** Umbauplan als Dokument unter `studien/`,
  kein Code. Gebaut wird erst nach Wilhelms zweitem Ja.
- **#80 Kanal-Güte neu eichen** (Studien-Strang). Bis dahin Warnhinweis „ungeeicht"
  an der Güte-Zahl.
- **rsi2seit-mcp V4: Bestätigungsmessung** — vorregistriert, wartet auf frische
  Handelstage (beide Archive enden am 24.08.).
- **Zweig `claude/dashboard-integrated-browser-plvkv7` prüfen** (1 Commit) und bei
  Tauglichkeit einbauen; sonst mit Begründung vorlegen.
- **Kleine Wünsche, Reihenfolge fest:** #69 lokales Backup → #82 Herkunftsland-Filter
  Marktkarte → #70 Radar-Streusuchen → #33 zweiter Trendwende-Detektor.

### Hinweise des Tüftlers an alle (keine Aufträge)

- Das Feld `quelle` der **1d**-Archivdateien trägt ein falsches Etikett
  (`"yahoo v8 chart, range=730d interval=60m"`) — drin sind Tageskerzen ab 1986.
- Neuer Entwurfsfehler für `FEHLERTYPEN.md`: *Ein Querschnittsmerkmal, dessen Auswahl
  von Tag zu Tag beharrt, kann gegen eine Symbol-Eigen-Kontrolle (A7) keinen Überschuss
  zeigen. Beharrlichkeit gegen die Zufallserwartung gehört vor die Vorregistrierung.*

---

## Läuft gerade

*Wer welche Dateien belegt. Trag dich ein, bevor du anfängst; nimm dich raus, wenn du
fertig bist.*

- **Niemand.** Letzter Commit 03:27 (Analytiker). Arbeitsbaum sauber.
- Zuletzt fertig (App-Codebase Master): #76, #84, #85, #83/#89, #86/#87/#88,
  Messmaschine versionieren, Stufe F Punkt 1.

---

## Entschieden

*Entscheidungen von Wilhelm, mit Datum. Eine Entscheidung, die nur in einem Chatverlauf
steht, ist nach zwei Stunden verloren.*

- **26.08.2026, 01:40 — Release jetzt.** → **(a) Jetzt ausliefern.**
  **STATUS 08:10: nicht ausgeführt.** Die Release-Wache läuft „nur von Hand"; kein
  Automatismus startet sie. Inzwischen warten **sieben** Notizen.

- **26.08.2026, ~01:45 — die Issue-Wache ist zurück, aber als TRIAGE.** Sie war
  unbemerkt aus der Aufgabenliste verschwunden (mindestens zum zweiten Mal); #83 und #89
  lagen deshalb über vier Stunden unbeachtet. Wilhelm wollte sie in der Cloud neu anlegen
  und an „neues Issue" binden. **Das ist nicht baubar:** die Schnittstelle verlangt eine
  Cloud-Umgebung (`ccr.environment_id`), die an das Repo gebunden ist; auf diesem Rechner
  ist keine hinterlegt, und einrichten kann sie nur Wilhelm selbst. Er hat entschieden,
  **das vorerst zu lassen**. Stattdessen läuft sie wieder **lokal alle 30 Minuten**.
  Sie **baut nichts und liefert nichts aus**: sie sichtet, ordnet ein, antwortet
  freundlich auf Deutsch und lässt Issues offen; schließen darf sie nur nachweislich
  Erledigtes und exakte Doppel. Sie schreibt auch **nicht** auf diese Tafel.
- **26.08.2026, ~01:45** — Neue Aufgabe **`projekt-manager-abruf`**, „nur von Hand".
  Damit kann Wilhelm einen Projektstand abrufen, wann er will. Sie berichtet nur und
  schreibt die Tafel nicht neu — Ausnahme: trifft Wilhelm dabei eine Entscheidung,
  trägt sie diese unter „Entschieden" ein und gibt sie weiter.
- **26.08.2026, ~01:15** — *#83 und #89 widersprachen sich: bleibt unter „Heute" etwas von
  „Meine Papiere" stehen?* → **(b) Unter „Heute" verschwindet der Abschnitt ganz.** Damit
  gilt #89 vor #83. Der PM hatte (a) empfohlen; Wilhelm hat anders entschieden.
  **Folge, mitentschieden:** das überschreibt Felix' Wunsch #71 („Signalstand prominent
  auf Heute") — der Signalstand zog deshalb in die Vermögen-Tabelle um.
- **26.08.2026, 00:45 (drei Antworten)** —
  (1) *Wohin mit #83/#89?* → **sofort erledigen**, nicht hinter die Neumessung stellen.
  (2) *Die „belegt"-Formel in 21 Quellcode-Kommentaren?* → **alle 21 umschreiben.** Der
  PM hatte „stehen lassen" empfohlen; Wilhelm hat anders entschieden.
  (3) *Neumessung: alle vier Vorstufen abwarten oder früher starten?* → **alle vier
  (#85–#88) zuerst.** Erst wenn die Instrumente stimmen, wird gemessen.
- **25.08.2026 (spät)** — Geheimnis `TELEMETRIE_JSON` angelegt; #76 vollständig erledigt.
- **25.08.2026** — Kommerzielles und Mehrbenutzer sind vorerst kein Thema. Das Werkzeug
  ist für Wilhelm allein; Schwerpunkt sind Werkzeuge, Bedienbarkeit, Optik und ein
  vollständiger Marktüberblick.
- **25.08.2026 (spät)** — Messmaschine wird versioniert, alle zwölf Strategien werden auf
  dem aktuellen Stand neu gemessen; erst danach neue Untersuchungen.
- **25.08.2026 (spät)** — Neue Rolle **Strategie-Tüftler**: jede Nacht 04:30; bei
  ≥3 wartenden Entwürfen arbeitet er stattdessen am Datenbestand. Misst NIE selbst.
  Übergabe über `studien/tueftler/WARTESCHLANGE.md`.
- **25.08.2026 (spät)** — Neue Rolle **Analytiker**: jede Nacht 03:15, prüft alles,
  meldet per Issue nur bei Fund, sonst eine Zeile hier auf der Tafel.
- **25.08.2026 (abends, 9 Antworten)** — E-Rest: ja. Stufe F: alle drei, Reihenfolge
  Theme → Chart → Barrierefreiheit. Nachbilden-Dialog: Belegstatus rein.
  Handel-aus-Renderer: erst Plan, Bau nur mit zweitem Ja. #80: neu eichen, solange
  Warnhinweis. V4: vorregistrieren. Browser-Zweig: prüfen und einbauen.
  #71/#78/#81: geschlossen. Wünsche: #69 → #82 → #70 → #33.
- **25.08.2026** — Der Projekt-Manager darf Unstrittiges selbst zuteilen; alles, was die
  Handelslogik berührt, neu ist oder Geld kostet, wird vorgelegt.
