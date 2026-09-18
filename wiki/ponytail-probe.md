# Ponytail-Probe 18.–25.09.2026

**Entscheid Wilhelm, 18.09.2026:** Ponytail (https://github.com/DietrichGebert/ponytail, MIT, Copyright (c) 2026 DietrichGebert, Stand e3ba2aa vom 14.09.2026) eine Woche im Markt-Dashboard ausprobieren. Eingebaut als eigener Abschnitt am Ende von `CLAUDE.md` („Ponytail — Probe 18.–25.09.2026“); dazu die beiden Werkzeug-Skills `/ponytail-review` und `/ponytail-debt` unter `.claude/skills/`.

## Warum der Anweisungsblock und nicht das Plugin

Das Projekt sieht für Claude Code das Plugin vor (`/plugin marketplace add DietrichGebert/ponytail`, `/plugin install ponytail@ponytail`). Es erfüllt zwar die Bedingung des Auftrags (keine Abhängigkeit in `package.json`, kein Start mit der App), aber:

- es installiert sich in den **Benutzerordner** (`~/.claude/`), gilt also für jedes Projekt von Wilhelm, nicht nur für dieses Repo;
- es startet bei jedem Prompt zwei Node-Hooks (`SessionStart`, `UserPromptSubmit`, `SubagentStart`), schreibt `~/.claude/.ponytail-active` und bietet einen `statusLine`-Eintrag in `~/.claude/settings.json` an;
- die beiden `/plugin`-Befehle brauchen eine interaktive Sitzung — **Wilhelms Hand**.

Das Projekt nennt die Anweisungsdatei ausdrücklich als vollwertige Form („instruction-only“, `AGENTS.md` kopieren). Der Unterschied zum Plugin: keine Stufen (`lite/full/ultra`), keine Ein-/Ausschaltbefehle. Für die Probe ist das gewollt: eine feste Stufe („full“) lässt sich messen, drei umschaltbare nicht. Will Wilhelm das Plugin trotzdem, sind es die zwei Befehle oben in einer eigenen Sitzung; der Block in `CLAUDE.md` bleibt dann trotzdem die Repo-Fassung mit den Streichungen.

## Jede Regel gegen CLAUDE.md geprüft

Quelle: `AGENTS.md` (Zeilen 1–26) und `skills/ponytail/SKILL.md` des Ponytail-Repos. Repo-Regeln schlagen Ponytail; jede Abweichung steht hier.

| Nr. | Regel (Kurzfassung) | übernommen | Grund | Wortlaut im Repo (`CLAUDE.md`, Abschnitt Ponytail) |
|---|---|---|---|---|
| 1 | Leitbild: fauler Senior, faul = sparsam, nicht nachlässig | ja | kein Widerspruch | „Du bist ein fauler Senior-Entwickler …“ |
| 2 | Sprosse 1: Muss das gebaut werden? (YAGNI) | ja | deckt sich mit „Erst fragen statt Umweg“ | Sprosse 1 |
| 3 | Sprosse 2: Gibt es das im Repo schon? | ja | deckt sich mit den Klinken „Markup an genau einer Stelle“, `U.kachel()` | Sprosse 2 |
| 4 | Sprosse 3: Standardbibliothek | ja, mit 4 zusammengelegt | Node-Stdlib und Browser/Electron sind hier dieselbe Frage | Sprosse 3 |
| 5 | Sprosse 4: native Plattform-Funktion | ja, mit 3 zusammengelegt | s. o. | Sprosse 3 |
| 6 | Sprosse 5: schon installierte Abhängigkeit | ja, verschärft | Repo: keine Änderung an `package.json`, keine neuen Abhängigkeiten | Sprosse 4 („Neue kommen nicht dazu“) |
| 7 | Sprosse 6: eine Zeile | ja | — | Sprosse 5 |
| 8 | Sprosse 7: Minimum, das funktioniert | ja | — | Sprosse 6 |
| 9 | Leiter läuft erst nach dem Verstehen | ja | deckt sich mit „Zuerst PROJEKTSTAND.md lesen“ und dem Lesen der berührten Klinken | „Die Leiter läuft, NACHDEM …“ |
| 10 | Fehler = Ursache, alle Aufrufer suchen | ja | deckt sich mit der Fehlerform-Kultur (`wiki/fehlerformen.md`) | „Fehlerbehebung = Ursache …“ |
| 11 | Keine unverlangten Abstraktionen | ja | — | Regel 1 |
| 12 | Keine neue Abhängigkeit, wenn vermeidbar | ja, verschärft | Repo: nie ohne Wilhelms Entscheid | Regel 2 |
| 13 | Kein Boilerplate, kein Gerüst für später | ja | — | Regel 1 |
| 14 | Löschen vor Hinzufügen, langweilig vor clever, wenigste Dateien | ja, mit Ausnahme | Sperrklinken, Gegenproben und Fehlerform-Kommentare sind Bestand; Release-Notiz, Übergabe, Vorregistrierung sind Pflichtdateien (CLAUDE.md „Ausliefern“, „Messen“) | Regel 3 |
| 15 | Kürzester funktionierender Diff, erst nach Verstehen | ja | — | Regel 4 |
| 16 | Komplexe Aufträge hinterfragen | ja, eingeschränkt | Rückfrage in einem Satz/Formular (Memory „Erst fragen statt Umweg“); Wilhelms Hand-Entscheid wird respektiert | Regel 5 |
| 17 | Von zwei Stdlib-Optionen die randfall-korrekte | ja | — | Regel 6 |
| 18 | `ponytail:`-Kommentar für bewusste Abkürzungen | ja, angepasst | Kommentar auf Deutsch; darf keinen Bezeichner nennen, den eine Klinke verbietet (Testmarken-Falle, Fehlerform „Sperrklinke frisst ihren Kommentar“) | Regel 7 |
| 19 | Nicht faul bei Verstehen, Eingabeprüfung, Datenverlust, Sicherheit, Barrierefreiheit, Verlangtem | ja, konkretisiert | Vertrauensgrenzen und Datenverlust-Pfade des Repos benannt (Yahoo, Alpaca, EDGAR, Issues, Archiv E:, Store) | „Nicht faul bei …“ |
| 20 | Nicht faul bei Hardware-Kalibrierung (Uhr driftet, Sensor liest falsch) | **nein** | Repo hat keine Hardware; Zeitstempel-Drift ist durch eigene Klinken geregelt (Stempel-Kerzen, Drift-Messer der IPC-Sonde) | gestrichen |
| 21 | EINE lauffähige Prüfung je nicht-trivialer Logik: assert-Demo oder kleine Testdatei, kein Framework | **angepasst** | Repo-Instrument ist `test-v6.js` (bzw. `test.js` der Studie) mit Gegenprobe je Klinke; lose Testdateien laufen in `npm test` und CI nicht; Messungen brauchen den Placebo | „… Zusicherung in `test-v6.js` … mit Gegenprobe … zusätzlich ihren Placebo“ |
| 22 | Triviale Einzeiler brauchen keinen Test | **angepasst** | keine eigene Zusicherung nötig, aber `npm test` muss grün sein — eine Klinke, die den Einzeiler trifft, entscheidet, nicht das Eigenurteil „trivial“ | (implizit: „kein eigenes Testgerüst … nur dafür“) |
| 23 | Gilt auch für Agenten am Ponytail-Repo selbst | **nein** | betrifft nur das Ponytail-Repo | gestrichen |
| 24 | SKILL.md: Stufen `lite/full/ultra`, Umschalten per `/ponytail`, „stop ponytail“ | **nein** | ohne Plugin keine Modi; feste Stufe „full“ ist messbar, drei umschaltbare nicht; „ultra“ (Löschen vor allem, Anforderung anfechten) ist mit den Sperrklinken nicht verträglich | gestrichen; Probe endet am 25.09. mit Wilhelms Entscheid |
| 25 | SKILL.md: Ausgabe „Code zuerst, dann höchstens drei Zeilen“ | ja, eingeschränkt | gilt für unverlangte Prosa; Übergabe-Datei mit Tokenverbrauch, Release-Notiz, Commit-Text für Anwender und Vorregistrierung sind vom Repo verlangt und bleiben voll | „Ausgabe im Chat …“ |
| 26 | SKILL.md: Besteht der Nutzer auf der vollen Fassung, wird sie gebaut | ja | deckt sich mit „Hand-Entscheid respektiert“ | Regel 5, zweiter Satz |
| 27 | SKILL.md: „Pair with Caveman“ (knappe Prosa) | **nein** | zweites Fremdregelwerk; Übergaben und Notizen müssen für Anwender lesbar bleiben | gestrichen |

Übernommen 21 von 27 (davon 7 angepasst oder eingeschränkt), gestrichen 6.

## Die beiden Werkzeug-Skills

- `/ponytail-review` — Diff auf Überbau prüfen, gibt eine Streichliste zurück, ändert nichts. Ergänzt das eingebaute `/simplify`, das Änderungen anwendet. Angepasst: Sperrklinken, Gegenproben und Placebo sind nie „yagni“.
- `/ponytail-debt` — sammelt alle `ponytail:`-Kommentare zu einem Register, damit „später“ nicht „nie“ wird.

Nicht übernommen: `/ponytail` (Modus-Umschalter, s. Nr. 24), `/ponytail-audit` (Repo-weiter Überbau-Bericht — doppelt die nächtliche Auditor-Rolle und würde die 21.000 Zeilen Gegenproben in `test-v6.js` als Überbau melden), `/ponytail-gain` (Werbetafel des Projekts), `/ponytail-help`.

## Messbasis für den Vergleich am 25.09.2026

Erhoben am 18.09.2026 (HEAD 4729bfc, vor dem Ponytail-Commit) mit `node tools/ponytail-messbasis.js <repo> <uebergabe-ordner> 2026-09-11 2026-09-18` (liest nur, schreibt nichts).

### 1. Zeilen je Commit, 11.–18.09.2026

Befehl im Werkzeug: `git log --since=2026-09-11 --until=2026-09-18T23:59:59 --numstat`. 83 Commits. Zeilen = eingefügt + gelöscht je Commit (Binärdateien zählen 0).

| Gruppe | Commits | Median | Mittel |
|---|---|---|---|
| nur `wiki/` berührt | 32 | 5,5 | 12,8 |
| mit Code (`*.js`, `*.cmd`, `*.html`, `*.mjs`), alle Dateien des Commits gezählt | 32 | 1.587 | 13.070 |
| dieselben Code-Commits, nur Zeilen in Code-Dateien gezählt | 32 | 279,5 | 449,4 |
| sonstige (weder nur wiki noch Code: JSON, Protokolle, Notizen) | 19 | 115 | 559 |

Lesehinweis: Das Mittel der Code-Commits tragen vier Datei-Ablagen (ee1f3fd +102.584, a03494a +72.677, ad23ca9 +71.310, bdfee67 +60.976 — Panel- und Studiendaten als JSON neben dem Code). Die Zeile „nur Zeilen in Code-Dateien“ ist die Größe, auf die Ponytail zielt; der Median ist gegen die Ablagen robust. Die Tafel je Commit (Hash, Datum, +/−, Klasse) druckt das Werkzeug mit aus.

### 2. Token je Sitzung aus den Übergaben, 11.–18.09.2026

Quelle: `C:/Users/Wilhe/Downloads/Markt-Dashboard-Daten/uebergabe/*.md` ohne das Präfix `auftrag-`, Datum im Dateinamen im Fenster; Pflichtzeile „Tokenverbrauch“/„Verbrauch“. Genommen wird die erste Zahl, die die Übergabe selbst als ihren Verbrauch nennt; das Maß ist nicht einheitlich (Kontextmaß gegen kumulierten Sitzungszähler), die Spalte „Maß“ hält es fest. Fehlt die Zeile: „ohne Angabe“, nicht geschätzt.

| Datum | Übergabe | Budget | Verbrauch | Maß |
|---|---|---|---|---|
| 12.09. | pr-text-paket-qs | — | ohne Angabe | — |
| 12.09. | release-wache-1200 | — | ohne Angabe | — |
| 12.09. | trendwende-ii-nachtrag3 | 120k | ≈105k | Kontextmaß |
| 12.09. | trendwende-ii-nachtrag4 | 130k | ≈120k | Kontextmaß |
| 12.09. | trendwende-ii-nachtrag5 | 150k | ≈105k | geschätzt |
| 12.09. | updater-paket | 120k | ≈220k | kumuliert |
| 12.09. | verschwundene-gruende | 150k | ≈105k | — |
| 13.09. | querschnitt-pruefstand-teil1 | 250k | ≈450k | — |
| 13.09. | trendwende-ii-klassen | 120k (+16k Nachschlag) | ≈94k | — |
| 15.09. | querschnitt-pruefstand-teil2 | 250k | ≈95k | geschätzt |
| 16.09. | chancen-karte | 150k | ≈320k | Zähler kumuliert (Kontext ≈150–160k) |
| 16.09. | fundamental-machbarkeit | 120k | ≈125k | — |
| 16.09. | fundamentaltafel | 150k+30k | ≈253k | Zähler (eigener Anteil ≈182k) |
| 16.09. | querschnitt-pruefstand-teil3 | 250k | ≈370k | — |
| 18.09. | panel-rueckwaerts-splits | — | ohne Angabe | — |
| 18.09. | querschnitt-pruefstand-teil4 | 250k | ≈355k | Zähler (Kontext ≈160k) |

16 Übergaben, 13 mit Angabe, 3 ohne. Verbrauch: Median **125k**, Mittel **209k**; Budget: Median 150k, Mittel 172k; 7 von 13 über Budget. (`trendwende-ii-2026-09-09.md` trägt das Datum 09.09. im Namen und zählt nicht, obwohl sie am 12.09. zuletzt geschrieben wurde: ≈710k gegen 450k.)

**Festlegung des PM (18.09.) zum Token-Maß:** Für den Vergleich zählt die **Abrechnung des Agenten-Rahmens** (die Zahl in der Fertig-Meldung, vom PM bei der Abnahme nach `offene-auftraege.md` übertragen), nicht die Selbstschätzung in der Pflichtzeile. Grund: die beiden Agenten dieses Auftrags meldeten 76k und 225k, abgerechnet wurden **152k und 406k** — die Schätzung über das Kontextfenster zählt System-Prompt und Werkzeugausgaben nicht und liegt um den Faktor 1,8–2,0 zu tief. Für Übergaben ohne Abrechnung (Nachtläufe, Chats von Wilhelm gestartet) bleibt die Pflichtzeile mit dem Vermerk „Selbstschätzung"; beide Maße getrennt ausweisen, nie mischen. Die Basis oben ist ganz Selbstschätzung — der Vergleich am 25.09. muss also die Selbstschätzung der neuen Woche gegen die Basis stellen **und** die Abrechnung daneben, wo sie vorliegt.

### 3. Vergleichsregel für den 25.09.

Gleiche Fenster (19.–25.09. gegen 11.–18.09.), gleiche Trennung (nur wiki / mit Code / nur Code-Zeilen / sonstige), gleiche Quellen und dasselbe Werkzeug (`node tools/ponytail-messbasis.js <repo> <uebergabe-ordner> 2026-09-19 2026-09-25`), Übergaben nach Datum im Dateinamen, „ohne Angabe“ bleibt „ohne Angabe“ — verglichen werden die Mediane; ein Mittel, das eine Datei-Ablage trägt, ist kein Befund. Vorbehalt: eine Woche mit anderen Aufträgen misst auch die Aufträge, nicht nur Ponytail — der Vergleich ist ein Hinweis, keine Messung mit Kontrolle.
