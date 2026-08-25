<!-- PM-STAND
letzter-bericht: 2026-08-25 21:30
gesehener-tag: v8.33.0
-->

# Projektstand

**Diese Tafel schreibt der Projekt-Manager, nicht du.** Sie ist der Kanal zwischen Wilhelm
und den Sitzungen: hier steht, was entschieden ist, was gerade läuft und was als Nächstes
ansteht. Lies sie beim Start; trag dich unter „Läuft gerade" ein, wenn du Dateien belegst.

Wenn du hier etwas änderst, dann nur deine eigene Zeile unter „Läuft gerade".

---

## Stand: 25.08.2026, 21:30

Ausgeliefert ist **v8.33.0**. Arbeitsbaum sauber, nichts Ungepushtes, alle Tests grün
(2074 Zusicherungen), UI-Probe grün (5 Reiter, 16 Pillen).

Der Struktur-Plan vom 25.08. (`studien/struktur-plan-2026-08-25/PLAN.md`) ist damit zu
großen Teilen abgearbeitet:

| Stufe | Inhalt | Stand |
|---|---|---|
| A | Politur, Sammelzeilen, Leerzustände, Kleintexte | fertig |
| B | Navigation gehört der Shell | fertig |
| C | Mittelfrist, Meine Papiere, Marktkarte als Pille | fertig |
| D | Bausteinkasten, Info-Register | fertig |
| E | `depot.js` zerlegen — sieben Blöcke | fertig (9.972 → 6.988 Zeilen) |
| E-Rest | `init()` dritteln, Speicher-Nebeneffekt aus `render()` | **offen** |
| F | Ein Chart-Renderer, Barrierefreiheit, Theme ohne Blitz | **offen** |

Dazu die Zusatzpunkte 3–12 der Kritik: fertig.

---

## Aufträge

*Was freigegeben ist und noch niemand macht. Wer eine Zeile nimmt, trägt sich unter
„Läuft gerade" ein und streicht sie hier.*

- **E-Rest freigegeben:** `init()` dreiteln (Migration / Verdrahtung / Scheduler) und die
  `equityHist`-Fortschreibung aus `render()` in den Scheduler ziehen. Methode wie Stufe E
  (byte-genauer Schnitt, Getter, Aliase, Testmarken umhängen). Handelspfad bleibt tabu.
- **Stufe F, Reihenfolge fest:** (1) Theme ohne Dunkel-Blitz beim Start, (2) ein einziger
  Chart-Renderer (`drawBig` vs. `chart.js` — Entscheid nach Funktionsvergleich),
  (3) Barrierefreiheit (Rest #59 Stufe 3). Je eigenes Vorhaben, je eigene Release-Notiz.
- **Nachbilden-Dialog:** Belegstatus sichtbar in den Dialog „Trade nachbilden“ —
  Belegtexte aus den Protokollen (`DepotAPI.protokollKante`), nie aus Prosa.
- **Handel raus aus dem Renderer — NUR PLAN:** ein Umbauplan als Dokument unter
  `studien/`, kein Code. Gebaut wird erst nach Wilhelms zweitem Ja (siehe „Wartet auf Wilhelm“).
- **#80 Kanal-Güte neu eichen:** Studien-Strang. Bis die Eichung steht, bekommt die
  Güte-Zahl in der Oberfläche einen Warnhinweis („ungeeicht“).
- **rsi2seit-mcp V4: Bestätigungsmessung vorregistrieren** (Studien-Strang). Ehrlicher
  Rahmen: Intervall [+0,018, +0,117] gegen Hürde 0,10 — läuft, sobald genug frische Tage da sind.
- **Zweig `claude/dashboard-integrated-browser-plvkv7` prüfen** (1 Commit: Browser-Treiber,
  Aufzeichnung, Einzeldatei) und bei Tauglichkeit einbauen; sonst mit Begründung vorlegen.
- **Danach die kleinen Wünsche, Reihenfolge fest:** #69 lokales Backup → #82 Herkunftsland-
  Filter Marktkarte → #70 Radar-Streusuchen → #33 zweiter Trendwende-Detektor.
- **#85 — laufende Quote-Stempel-Kerze im 60m-Archiv abschneiden** (Analytiker-Fund
  25.08.): Abruf-Werkzeug und/oder Messmaschine müssen den unfertigen letzten Balken
  verwerfen. **Vorstufe der Neumessung** — muss vor ihr erledigt sein.
- **Messmaschine versionieren und alle Kanten neu messen** (freigegeben 25.08. spät):
  (1) Versionsnummer der Messmaschine an ihren Code koppeln (heute 7 Änderungen bei
  unverändert „1.0.0“) und veraltete Protokolle in der Übersichtstafel als solche
  kennzeichnen; (2) danach alle zwölf Strategien einmal auf dem aktuellen Instrumenten-
  Stand neu messen. Erst dann neue Untersuchungen. Quelle: Befundbericht „Sieben stille
  Fehler“, Abschnitt 5. Messwerkzeug, keine Handelslogik. Der Analytiker prüft ab jetzt
  nächtlich, ob Protokolle und Instrumenten-Stand zusammenpassen.
- **#84 — „belegt“-Prosa entfernen** (Analytiker-Fund 25.08.): fünf feste Texte nennen
  Kanten „belegt“, kein Protokoll sagt „bestätigt“; Wortlaut auf „gemessen“ umstellen
  (Fundstellen im Issue). Gehört zum selben Aufwasch wie #76.
- **#76 — die sieben gesammelten Fehler vom 25.08. reparieren** (inkl. #76.2, die zu enge
  fetch-Refspec von origin). Warum: gemeldete Fehler, freigegeben durch die Hausregel
  „Reparatur von Warnsignalen“. Dateien: laut Issue #76, je Fehler einzeln committen.
  *(zugeteilt vom Projekt-Manager, 25.08. 21:45 — noch von niemandem genommen)*

---

## Läuft gerade

*Wer welche Dateien belegt. Trag dich ein, bevor du anfängst; nimm dich raus, wenn du
fertig bist.*

- **App-Codebase Master** — hat am 25.08. spät die offene Issue-Liste zur Abarbeitung
  übernommen (Reihenfolge siehe Aufträge); Details trägt er selbst nach.

---

## Entschieden

*Entscheidungen von Wilhelm, mit Datum. Eine Entscheidung, die nur in einem Chatverlauf
steht, ist nach zwei Stunden verloren.*

- **25.08.2026** — Stufe C des Struktur-Plans wird gebaut, einschließlich Marktkarte als
  Pille unter „Heute".
- **25.08.2026** — Stufe D Punkt 6 (Erklärtexte ins Info-Register) wird gebaut; das
  Diagnose-Banner kommt auf das Dialog-Muster, **kein** Onboarding.
- **25.08.2026** — Kommerzielles und Mehrbenutzer sind vorerst kein Thema. Das Werkzeug
  ist für Wilhelm allein; Schwerpunkt sind Werkzeuge, Bedienbarkeit, Optik und ein
  vollständiger Marktüberblick.
- **25.08.2026 (spät)** — Messmaschine wird versioniert, alle zwölf Strategien werden auf
  dem aktuellen Stand neu gemessen; erst danach neue Untersuchungen (Empfehlung aus dem
  Befundbericht „Sieben stille Fehler“, von Wilhelm bestätigt).
- **25.08.2026 (spät)** — Neue Rolle **Analytiker**: läuft jede Nacht 03:15, prüft alles
  (Wächterprüfungen, Kanten-Neuberechnung, kritische Methodenbeurteilung), meldet per
  Issue nur bei Fund, sonst eine Zeile hier auf der Tafel.
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

---

## Was nicht angefasst wird

Gilt unabhängig von dieser Tafel und steht ausführlich in `CLAUDE.md`:

- **Handelslogik** — `intradayScan`, Autopilot- und Edge-Ring, `SETUPS`, `modeParams`,
  Gates, die `window.confirm`-Gatter vor `takt()` und der Demo-Order. Nur mit eigenem,
  abgesprochenem Auftrag.
- **Versionen und Releases** — die vergibt die Release-Wache, keine Sitzung.
- **`telemetrie.json`** wird nie committet. `git clean -xdf` wird nie ausgeführt.
