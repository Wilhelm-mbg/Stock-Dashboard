<!-- PM-STAND
letzter-bericht: 2026-08-26 08:40
gesehener-tag: v8.33.2
-->

# Projektstand

**Diese Tafel schreibt der Projekt-Manager, nicht du.** Sie ist der Kanal zwischen Wilhelm
und den Sitzungen: hier steht, was entschieden ist, was gerade läuft und was als Nächstes
ansteht. Lies sie beim Start; trag dich unter „Läuft gerade" ein, wenn du Dateien belegst.

Wenn du hier etwas änderst, dann nur deine eigene Zeile unter „Läuft gerade".

---

## Stand: 26.08.2026, 08:40 (Nachtrag zum 08:10-Bericht)

Ausgeliefert ist **v8.33.2** — unverändert seit gestern Abend. Der Quellstand ist
vierzehn Commits weiter; **sieben Release-Notizen warten** auf die Wache. Arbeitsbaum
sauber, nichts Ungepusht.

**Die Tests sind wieder grün** (PM geprüft 08:40: `eslint` + `test-channel` + `test-v6`
alle bestanden). Alle drei SOFORT-Aufträge des 08:10-Laufs sind in 17 Minuten erledigt
worden.

Der große freigegebene Auftrag — die **Neumessung aller zwölf Strategien** — ist jetzt
vollständig unblockiert und dem App-Codebase Master zugeteilt.

Der Struktur-Plan vom 25.08. (`studien/struktur-plan-2026-08-25/PLAN.md`):

| Stufe | Inhalt | Stand |
|---|---|---|
| A–E, E-Rest | Politur, Navigation, Reiter, Bausteinkasten, `depot.js` zerlegen | fertig |
| F (1) | Theme ohne Dunkel-Blitz | **fertig** (26.08.) |
| F (2) | Ein einziger Chart-Renderer | offen, GESPERRT (Entscheid Wilhelm) |
| F (3) | Barrierefreiheit | offen, hinter (2) |

---

## Aufträge

*Was freigegeben ist und noch niemand macht. Wer eine Zeile nimmt, trägt sich unter
„Läuft gerade" ein und streicht sie hier.*

### ~~SOFORT — rote Tests~~ **Erledigt 26.08. 08:20** (`d689e62`)

Zwei Lanczos-Konstanten standen in Literatur-Schreibweise; JS speichert die letzte
Ziffer anders. Bitgleich ersetzt, **keine eslint-Ausnahme** für die Datei — die Regel
fängt echte Tippfehler, und dort stehen sechs lange Konstanten nebeneinander. Warum die
Zahlen jetzt anders aussehen als im Lehrbuch, steht als Kommentar daneben.
PM-Gegenprobe 08:40: `npm test` grün.

### ~~SOFORT — #91~~ **Erledigt 26.08. 08:25** (`e3998b1`)

`aussicht.tage80` rechnet jetzt gegen die Bonferroni-Schwelle. Gegenprobe: zwei Läufe
auf demselben Archiv, tests 1 → 7, tage80 **11 → 17**.
**Zwei Zahlen meiner Zuteilung waren falsch und sind korrigiert:** es sind **17** von 21
Protokollen mit mehr als einem Test (nicht 16), und in der Tabelle fehlte die Zeile für
5 Tests (49 %).
**Maschinenversion steht auf 1.2.0, nicht 1.1.0** — der Master ist bewusst von meiner
Zuteilung abgewichen und hat recht: bei gleichen Daten meldete 1.1.0 vor und nach dieser
Zeile bis zu 59 % andere `tage80`; genau diese Frage soll die Version beantworten. Die
Sperrklinke beim allerersten Anlass durchzuwinken wäre ihr erster Ausfall gewesen.
**Der PM übernimmt das.** Wilhelm kann es mit einer Zeile zurückdrehen, wenn er es
anders sieht; die Gegenmeinung steht im Code.

### ~~SOFORT — #90~~ **Erledigt 26.08. 08:27** (`4276380`)

Das News-Laufband ist bei reduzierter Bewegung jetzt schiebbar statt tot: **6 von 6**
Schlagzeilen erreichbar statt dauerhaft 3. Zusätzlich zur Auditor-Sonde gemessen, denn
`overflow: auto` heißt nur, dass ein Rollbalken erlaubt ist — nicht, dass er etwas
freigibt. Die Sonde des Auditors blieb unangetastet, sie ist der Beleg des Funds.

### JETZT DRAN — Neumessung aller zwölf Strategien (PM zugeteilt 26.08. 08:40)

**Vollständig unblockiert.** Alle fünf Vorstufen sind repariert (#85–#88, #91), die
Maschine steht auf **1.2.0** mit `codeStand`. Das ist **ein langer Rechenlauf, kein
Umbau**. Danach tragen die Protokolle einen echten Stand statt „unbekannt" (26 alte
Protokolle stehen heute ohne Kennung da). **Erst danach neue Untersuchungen.**
Zugeteilt an **App-Codebase Master**.

### Wartet auf Wilhelm (nicht anfangen)

- **`ausstieg`-Schalter in der Messmaschine** (Auftragsvorschlag A des Tüftlers).
  Vorbedingung für den Studien-Kandidaten `glockendruck-nacht`. PM-Frage 2 vom 26.08.
- **Auktionskosten am Demo-Konto messen** (Auftragsvorschlag B). PM-Frage 3 vom 26.08.
- **Release** — gehört der Release-Wache, die nur von Hand läuft. PM-Frage 1 vom 26.08.
- **Stufe F (2), ein einziger Chart-Renderer** — neu hinzugekommen 26.08. 08:40. Der
  Master hat beim Ansehen festgestellt, dass die Zusammenlegung **nicht folgenfrei** ist:
  es braucht einen Entscheid, **welche Darstellungen wegfallen dürfen**. Das ist Wilhelms
  Entscheidung, nicht die einer Sitzung. Bis dahin **gesperrt**, auch Stufe F (3) dahinter.

### Danach — schon freigegeben, Reihenfolge fest

- **Großer Archiv-Ausbau:** Backfill 60m und täglich auf E:, Universum nach
  Wertpapierart verbreitern. Ausdrücklich NACH der Neumessung.
- **Stufe F (2) und (3)** — stehen jetzt oben unter „Wartet auf Wilhelm", nicht mehr hier.
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

- **App-Codebase Master** — nichts belegt, alle drei Aufträge vom 08:10-Lauf erledigt:
  **(1) rote CI** (`d689e62`, gepusht) — zwei Lanczos-Konstanten in Literatur-Schreibweise,
  bitgleich ersetzt statt eslint-Ausnahme; Selbstkontrolle unverändert 4,26e-14.
  **(2) #91** (`e3998b1`) — Aussicht rechnet gegen die Bonferroni-Schwelle. Nachgezählt:
  **17** von 21 Protokollen mit >1 Test, nicht 16; für 5 Tests fehlten 49 % in der Tabelle.
  **Maschinenversion auf 1.2.0, entgegen der Zuteilung** — Begründung im Commit und im
  Issue: bei gleichen Daten meldete 1.1.0 vorher und nachher bis zu 59 % andere tage80.
  Die Sperrklinke ist genau dafür gebaut; sie durchzuwinken wäre ihr erster Ausfall.
  **(3) #90** (`4276380`) — Laufband bei reduzierter Bewegung schiebbar. Gemessen 6 von 6
  Schlagzeilen erreichbar statt dauerhaft 3.
  Zuletzt fertig davor: #76, #84, #85, #83/#89, #86/#87/#88, Messmaschine versionieren,
  Stufe F Punkt 1.

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
