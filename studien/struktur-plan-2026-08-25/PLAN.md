# Struktur-Plan für die Oberfläche — Design- und Endnutzer-Audit vom 25.08.2026

**Für:** jede Sitzung, die an der Oberfläche baut. **Von:** Design-/Endnutzer-Test-Sitzung vom 25.08.2026, Stand `31f1b49` (v8.31.2 + 5 unausgelieferte Commits).
**Geltung:** Zeilennummern sind Momentaufnahme — es arbeiten parallele Sitzungen. Verlässlich sind die genannten **Kennungen** (Element-IDs, Funktionsnamen, CSS-Klassen); vor jedem Edit den Anker per Suche neu finden.

**Wie getestet wurde:** Kompletter Quellcode-Durchgang (index.html, alle 31 Renderer-Module, main.js), dazu ein Endnutzer-Durchlauf in einer **isolierten Testinstanz** (eigenes userData, eigener Datenordner, Erststart-Zustand) durch alle 6 Reiter, alle Pillen, beide Themen und zwei Fensterbreiten (1240/780 px) — plus Abgleich mit der laufenden, gefüllten Installation. Die offenen Nutzerwünsche (#71 Felix, lokale Fehlermeldungen) sind eingearbeitet. Der Audit vom 23.08. (#59) bleibt gültig; dieses Dokument ersetzt ihn nicht, sondern beantwortet die Strukturfrage, die dort offen blieb (Stufe 3).

---

## 1. Bestandsaufnahme — was die App heute ist

Sechs Reiter, drei davon mit Pillen-Unternavigation. Immer sichtbar: Kopfzeile (Titel, Stand, 4 Knöpfe), Untertitel, **Cockpit** (sticky: Depot / Heute / Offen / Bücher / US-Börse / Scan), Warnband, Fußzeile.

| Reiter (Label) | `data-tab` | Inhalt (Pillen **fett**) |
|---|---|---|
| Heute | `dashboard` | Ticker, Index-Kacheln, Marktbild-Heatmap, **Mein Depot** (echte Papiere: Signalliste + Übernahme-Formular), Gewinner/Verlierer, Spekulations-Radar, Insider-Käufe, Vorbörsen-Lücken, Einzelwerte-Klappe, Kalender, News |
| Marktkarte | `marktkarte` | eine Treemap mit 2 Filtern |
| Regeln | `strategien` | **Übersicht** (Strategiekarten mit Belegstatus) · **Schalter & Einstellungen** (Intraday-Karte, Risiko, Archiv, Signal-Monitor, Watchlist) · **Regelbuch** (Regel-Kopf, Mess-Regeln, Bilanz, Experiment-Journal, Filter-Nutzen, Benchmark) · **Chart** (Strategie-Chart) · **Autopilot** (Nachtmessung, Backfill, Marktlage, Berichte, Backtest) |
| Vermögen | `depot` | **Depot** (Kacheln, Verlauf, offene Positionen, „Mein Depot"-Zweittabelle) · **Mittelfristig** (Momentum-Rechner **mit Parametern**, Mittelfrist-Depot **mit 3 Handelsknöpfen**, Drift-Rechner **mit Parametern**) · **Protokoll** (Trade-Log, CSV) |
| Werkzeuge | `werkzeuge` | **Aktien-Explorer** · **Schein-Finder** · **Trendfinder** · [Pille „Einstellungen …" öffnet nur das Modal] |
| Messung | `messung` | Scoreboard, Strategien-Liste, Strategie-Baukasten (eine lange Scroll-Seite) |

Dazu drei Modals (Analyse, Order-Ticket, App-Einstellungen) und ein selbstgebautes Erststart-Banner (Diagnose-Einwilligung).

Technisch: kein Bundler, 31 klassische `<script>`-Tags, Verdrahtung über `window.*`. `depot.js` (9.763 Zeilen, eine IIFE) rendert in **vier Reiter plus Cockpit/Warnband** und verkabelt in seiner `init()` (>1.000 Zeilen) die **Pillen-Navigation aller Reiter** — bis `init()` durch ist, sind alle Pillen tot. Navigation hat **keine Zustandserhaltung** (Neustart ⇒ immer „Heute", erste Pille).

---

## 2. Zielbild — vier Fragen, klare Zuständigkeit

Die App beantwortet vier Nutzerfragen. Jeder Reiter gehört genau einer Frage; nichts beantwortet zwei:

1. **Was ist heute los?** → Heute (Markt, eigene Papiere im Signalstand, Beobachtungs-Karten)
2. **Was besitze/führe ich?** → Vermögen (nur Bestände, Verläufe, Protokoll — **keine Stellschraube, kein Handelsknopf**)
3. **Wonach wird gehandelt?** → Regeln (alle Schalter, Parameter, Handels-/Rechenknöpfe, Autopilot, Bilanz der Regeln)
4. **Was ist belegt?** → Messung (Scoreboard, Strategie-Ablage)

Plus **Werkzeuge** als Querschnitt (nachschlagen und rechnen, ohne Zustand der Strategie zu berühren).

Der Satz steht heute schon in der App („Wonach gehandelt wird … steht im Reiter Regeln", Simnote in `#tab-depot`) — er wird nur nicht eingehalten. Das Zielbild ist also keine Neuerfindung, sondern die Durchsetzung der eigenen Ordnung.

**Ziel-Navigation (nach Stufe C):**

| Reiter | Pillen |
|---|---|
| Heute | Überblick · Marktkarte · Radar & Insider |
| Vermögen | Simulation · Bücher · Meine Papiere · Protokoll |
| Regeln | Übersicht · Intraday · Mittelfrist · Bilanz & Chart · Autopilot |
| Messung | (wie gehabt, ggf. Pillen Scoreboard · Strategien · Neu) |
| Werkzeuge | Explorer · Schein-Finder · Trendfinder |

Die Kernverschiebungen: Momentum-/Drift-Parameter und die drei Handelsknöpfe (`#mfdTaktBtn`, `#mfdRebalanceBtn`, `#mfdDriftBtn`, `#mfLadenBtn`, `#drRechneBtn` …) wandern von Vermögen→Mittelfristig in eine neue Pille **Regeln → Mittelfrist**; Vermögen→**Bücher** zeigt nur noch Stand, Positionen und Verworfen-Liste der beiden Bücher. Das Übernahme-Formular (`#bestandText`) wandert von Heute nach Vermögen→**Meine Papiere** (zur bestehenden `#bestandTabelle`); Heute behält die kompakte **Signalliste** (`#bestandListe`) — die Felix in #71 ausdrücklich prominent auf „Heute" will, untergliedert nach Kurz-/Mittelfrist-Signal. Die Marktkarte wird eine Pille unter Heute; der Reiter entfällt (sie lädt heute schon nur bei Aktivierung).

---

## 3. Befunde des Endnutzer-Tests

Sortiert nach Art: **S** Struktur, **B** Baustein/Konsistenz, **P** Politur. Schwere in Klammern (◼◼◼ behindert Verständnis/Bedienung, ◼◼ stört, ◼ Schönheit).

### Struktur

- **S1 (◼◼◼)** „Vermögen → Mittelfristig" ist eine Steuerzentrale im Anzeige-Reiter: drei Module (`mittelfrist.js`, `mfdepot.js`, `driftui.js`) mit drei Statuszeilen, drei Ladeknöpfen, ~9 Parametern und drei Handelsknöpfen — direkt unter der Simnote, die verspricht, all das stehe unter „Regeln".
- **S2 (◼◼)** „Heute" ist ein Scrollband aus 10 Sektionen ohne Binnennavigation. Die eigenen Papiere existieren doppelt: Signalliste + Übernahme auf Heute (`#bestandListe`), Tabelle in Vermögen→Depot (`#bestandTabelle`) — mit wechselseitigen Verweistexten statt einem Zuhause.
- **S3 (◼◼)** Reiter-Gewichte extrem ungleich: Marktkarte = 1 Ansicht; Regeln = 5 Pillen, davon „Regelbuch" mit sechs Panels gemischter Zwecke; Messung = eine lange Scroll-Seite.
- **S4 (◼◼◼)** Ein Wort, zwei Bedeutungen: Cockpit-„DEPOT" (Simulationsbuch) vs. „MEIN DEPOT" (echte Papiere) auf derselben Seite. Erstnutzer können nicht wissen, dass 100.000 $ virtuell sind, ohne den Untertext zu lesen.
- **S5 (◼◼)** Keine Zustandserhaltung: Neustart wirft immer auf „Heute"/erste Pille zurück. Quersprünge (Heatmap-Kachel → Explorer) haben keinen Rückweg.
- **S6 (◼)** `data-tab`-Kennungen ≠ Labels (`dashboard`→Heute, `strategien`→Regeln, `depot`→Vermögen), DOM-Reihenfolge der Panels ≠ Reiter-Reihenfolge, verwaiste Struktur-Kommentare („TRENDWECHSEL", „PROTOKOLL", „AUSWERTUNG" an falschen Stellen) und ein leeres `<div class="grid2">` in `#sub-auswertung`. Für Menschen egal, für jede bauende KI eine Falle.
- **S7 (◼)** Überschrift „Drei Zeithorizonte, drei getrennte Strategien" über **vier** Strategiekarten plus Langfrist-Zeile.

### Bausteine

- **B1 (◼◼◼)** Zwei Erklärsysteme parallel: **171** `title`-Tooltips gegen **18** Info-Knöpfe. Die kompletten Experten-Einstellungen (`#idParams`) erklären sich nur per `title` — laut eigenem CSS-Kommentar „weder per Tastatur noch auf einem Tastbildschirm erreichbar". Der Trendfinder trägt seine Erklärung als Dauertext (2 lange Absätze vor der Tabelle) — das Muster aus Audit-Stufe 2 (Info-Knopf) ist dort nicht angewandt.
- **B2 (◼◼)** Wiederholungs-Wände statt Aggregation: Signal-Monitor zeigt ~30 identische Zeilen „Kursreihe zu kurz (148 < 261 Kerzen)…", der Trendfinder 15× „kein Vortrend / zu wenig Historie / kein Wechsel". Eine Sammelzeile („28 Werte warten auf Archiv-Aufbau — Details") fehlt als Baustein.
- **B3 (◼◼)** Leerzustände uneinheitlich: vorbildlich (Depot, Positionen, Protokoll), fehlend (Strategie-Chart: schwarze SVG-Fläche **mit bereits sichtbarer Legende**; Schein-Finder: gar nichts unter den Filtern), oder mit Entwickler-Jargon: Marktkarte und Scoreboard nennen im Endnutzer-Leerzustand `node tools/stammdaten-holen.js` bzw. den **vollen Windows-Pfad** des Protokollordners. Ein Installations-Nutzer hat weder node noch den Quellcode.
- **B4 (◼◼)** Vier `esc()`-Kopien, acht handgebaute Statuszeilen, zwei konkurrierende Chart-Renderer (`chart.js` vs. `explorer.js drawBig`, ~380 Zeilen, mit **Hex-Farben an der Token-Palette vorbei**), Kachel-Markup dreifach handgebaut (`depot.js tile()`, `mfdepot.js`, `driftui.js` — dort mit Inline-`font-size` je Element), das Diagnose-Banner als einziges Overlay außerhalb des `modal-bg`-Musters, ein natives `window.confirm` in `mfdepot.js`. `marktkarteui.js` umgeht die eigene Pixelwert-Prüfregel per String-Verkettung (im Kommentar offen zugegeben).
- **B5 (◼)** `scoreboard.js` führt zwei Urteil-Tabellen für dieselben Schlüssel (`LABEL`/`FARBE` und `URTEIL_TEXT`); eine kennt `bestaetigt-aber-nullpunkt-verschoben` nicht.

### Politur (alles im Erststart-Test gesehen)

- **P1 (◼◼)** `#kostenHuerde` liegt **im** `.params`-Raster und wird in eine ~130-px-Spalte gequetscht — der wichtigste Kostentext der App bricht auf Wortbreite um (Experten-Klappe, Standardansicht).
- **P2 (◼◼)** „Alle Bücher zurücksetzen" (rot, destruktiv) steht in der Modal-Fußzeile **direkt neben** „Speichern" — dem meistgeklickten Knopf des Dialogs.
- **P3 (◼)** Schalter & Einstellungen: rechte Rasterspalte trägt nur die kleine Risiko-Karte, darunter Leere über die gesamte Höhe der Intraday-Karte (Unwucht des `strategy-grid`).
- **P4 (◼)** Selbstverweis: Auf „Vermögen → Mittelfristig" steht „Keine Tagesdaten – unter ‚Vermögen → Mittelfristig' einmal laden." Man **ist** dort.
- **P5 (◼)** Radar-Thesen enden mitten im Satz ohne Auslassungszeichen („…der MPS", „Was danach kam") — Anzeige schneidet hart ab.
- **P6 (◼)** Erststart: Das Diagnose-Banner liegt ohne Abdunkelung über dem halb geladenen Dashboard; danach gibt es keinerlei geführten Einstieg (leere Karten erklären sich unterschiedlich gut).
- **P7 (◼)** Messung: Spalte „Ort" zeigt 12× „Projekt", Läufe/Zuletzt 12× „–" — die Fußzeile fasst gut zusammen, die Tabelle darüber wiederholt.

### Technik (Wartbarkeit — Grundlage jeder weiteren UI-Arbeit)

- **T1 (◼◼◼)** `depot.js`: `init()` >1.000 Zeilen (Migrationen + komplette Formular-Verdrahtung + ~15 Timer), `render()` mit Speicher-Nebeneffekt (`equityHist` + `save()`), `intradayScan()` ~770 Zeilen Anzeige und Handel verwoben, Pillen-Navigation aller Reiter im Fachmodul.
- **T2** Sieben sauber herauslösbare Blöcke (~2.900 Zeilen): Trendfinder (`wende*`), Signal-Chart (`stc*`), Backtest+Worker-Pool (`BTPool`), Backfill/Datenquellen-Diagnose, Berichte/Export, Kostenmessung (`kostenRunde*`/Spannen), Tiefensuche/„Zucht". Details und Schnittkanten: siehe Abschnitt 4, Stufe E.
- **T3** `bugs.js` rät den aktiven Reiter über einen Inline-Style-Selektor (`.tab:not([style*="display: none"])`) — bricht bei jeder Änderung der Reiterschaltung.
- **T4** `scoreboard.js` lädt beim Start blind per `setTimeout(…, 4000)` auch ohne Reiterbesuch; `bestandui.js` tickt fest alle 60 s ohne Reiterprüfung.
- **T5** Theme: asynchron nach erstem Paint geladen (Hell-Nutzer sehen dunklen Blitz); kein „System"-Modus.

**Was ausdrücklich gut ist und bleiben soll:** das Token-System samt Schrift-/Radien-Leiter mit begründeten Kontrast-Kommentaren; das Cockpit; die Strategie-Übersicht mit ehrlichen Belegstatus-Chips; das Archiv-Muster für Widerlegtes; das Regelbuch-Panel „Die Regel, die handelt" als Schlüssel-Wert-Tabelle; der Strategie-Baukasten (Live-Satz, Begründungszwang); Glossar und Info-Fenster; Hell-Thema und Umbruch bei 780 px tragen.

---

## 4. Umsetzungsplan — sechs Stufen, einzeln lieferbar

Jede Stufe ist ein eigenes Vorhaben: eigener Commit-Satz, eigene Release-Notiz, `npm test` grün. Nie zwei Stufen in einer Sitzung mischen. Stufen A, B, D sind unstrittig; **Stufe C braucht Wilhelms Entscheid** (Abschnitt 6); E ist Fleißarbeit mit klaren Schnitten; F sind Einzelentscheidungen.

### Stufe A — Politur (risikoarm, eine Sitzung)

1. `#kostenHuerde` aus dem `.params`-Raster nehmen (eigene Zeile volle Breite unterhalb der Gruppe „Risiko & Kosten") — nur Markup-Position, keine Textänderung. **(P1)**
2. „Alle Bücher zurücksetzen" aus `.modal-foot` in einen eigenen Abschnitt „Gefahrenzone" am Modal-Ende mit Bestätigungsschritt (bestehendes Sicherungs-Verhalten beibehalten — der Reset legt bereits eine Sicherung ab, das darf so bleiben). **(P2)**
3. Leerzustände: Strategie-Chart — Legende und SVG erst nach erstem Laden zeigen, stattdessen `.empty`-Baustein mit einem Satz; Schein-Finder — `.empty` unter den Filtern („Basiswert wählen, dann Laden & rechnen"). **(B3)**
4. Entwickler-Jargon aus Endnutzer-Leerzuständen: Marktkarte behält den „Jetzt holen"-Knopf, der `node`-Befehl und die Doppel-Meldung wandern in eine `details`-Klappe „Für Entwickler"; Scoreboard nennt statt des vollen Windows-Pfads nur „Datenordner → protokolle" (der echte Pfad steht in der Klappe). **(B3)**
5. Aggregatzeile als kleiner Baustein: Wenn >5 Zeilen desselben Status, eine Sammelzeile mit Zähler + `details` für die Einzelliste. Einsatz: Signal-Monitor (`#sigMonitor`) und Trendfinder (`#wendeTabelle`). **(B2)**
6. Kleintexte: Überschrift „Drei Zeithorizonte…" → „Die Strategien im Überblick" (S7); Selbstverweis in `#mfdStatus` → „erst oben ‚Daten holen und rechnen'" (P4); Radar-/Insider-Thesen mit `…` enden lassen, wenn abgeschnitten (P5); Messung-Tabelle: Spalte „Ort" nur zeigen, wenn es mehr als einen Ort gibt (P7).
7. `#stcIvWarn`-Muster prüfen: Trendfinder-Erklärblock in Info-Knopf + zwei Sätze Resttext umwandeln **nur, wenn Wilhelm der Info-Knopf-Linie zustimmt** (dieselbe Frage wie Audit-Stufe 2, siehe Abschnitt 6).

*Stolperfallen:* `test-v6.js` prüft Quelltext per Textmarke — nach jedem Umzug die betroffenen Zusicherungen suchen (`grep` nach der Kennung) und **mit umziehen**; eine Zusicherung, die bei korrektem Verhalten rot wird, wird repariert, nicht das Verhalten.

### Stufe B — Navigation gehört der Shell (eine Sitzung)

1. Den Pillen-Umschalter (heute in `depot.js init()`, generischer `querySelectorAll('.pills button[data-sub]')`-Block) nach `app-shell.js` verschieben, **vor** jedes `await` — Pillen sind ab dem ersten Frame bedienbar. Die Sonderfälle je Pille (`renderAnalytics`, `renderPilot`, `wendePruefen` …) bleiben in `depot.js`: die Shell feuert dafür ein `CustomEvent('sub-changed', {detail:{tab, sub}})` am `document`, `depot.js` hört darauf (Muster existiert schon: `tab-changed`).
2. Zustandserhaltung: aktiven Tab + aktive Pille je Tab in einem Store-Schlüssel `ui` speichern (`storeSet`), beim Start wiederherstellen. Ausnahme dokumentieren: Modals und Explorer-Detail werden nicht wiederhergestellt.
3. `bugs.js offenerTab()` auf `document.querySelector('nav.tabs button.active')?.dataset.tab` umstellen (entkoppelt vom Inline-Style-Trick). **(T3)**
4. Aufräumen ohne Verhaltensänderung: leeres `grid2` und die drei verwaisten Abschnitts-Kommentare in `index.html` entfernen; DOM-Reihenfolge der `tab-`Panels an die Reiterleiste angleichen (reine Verschiebung ganzer Blöcke). **(S6, Teil)**

*Stolperfallen:* Nichts an den `data-tab`/`data-sub`-**Werten** ändern (Tests und Logik hängen daran); `tab-changed`-Konsumenten (`strategien.js`, `scoreboard.js`, `marktkarteui.js`, `depot.js` 2×) unverändert bedienen.

### Stufe C — die Verschiebungen des Zielbilds (braucht Wilhelms Ja, 1–2 Sitzungen)

Reihenfolge so gewählt, dass jeder Schritt allein auslieferbar ist:

1. **Mittelfrist-Steuerung → Regeln.** Neue Pille „Mittelfrist" in `#regelPills`; die drei Panels (Momentum-Rechner, Mittelfrist-Depot-Steuerung, Drift-Rechner) ziehen als ganze DOM-Blöcke um — **Element-IDs unverändert** (`mfRueck`, `mfdTaktBtn`, `drHalten` …), damit `mittelfrist.js`/`mfdepot.js`/`driftui.js` ohne Logikänderung weiterlaufen. In Vermögen→„Bücher" (umbenannte Pille `mittel`) bleiben nur die Bestands-Anzeigen (`#mfdMomentum`, `#mfdDrift` als Lese-Kopie oder die Container ziehen mit und „Bücher" bekommt eigene Anzeige-Container — Entscheid der bauenden Sitzung, aber: **eine** Wahrheit, keine Doppel-Renderings).
2. **Meine Papiere → Vermögen.** Übernahme-Formular (`details` mit `#bestandText`) von Heute in eine neue Pille „Meine Papiere" neben die bestehende `#bestandTabelle`. Heute behält `#bestandListe` (Signalstand) mit einem Satz Verweis. Damit erfüllt: Felix #71 („prominent auf Heute, untergliedert nach Kurz-/Mittelfristsignalen" — `bestandui.js` liefert beide Signale schon; die Liste nach diesem Kriterium gruppieren).
3. **Cockpit-Beschriftung:** „Depot" → „Simulation" (nur der `ckl`-Text; Wert bleibt `#ckEquity`). Ein Wort löst S4.
4. **Marktkarte als Heute-Pille** (optional, wenn 1–3 gut gelandet sind): Heute bekommt `#heutePills` (Überblick · Marktkarte · Radar & Insider); die drei Beobachtungs-Karten (Radar, Insider, Vorbörse) ziehen in die dritte Pille, der Marktkarten-Block in die zweite; Reiter `marktkarte` entfällt aus der Leiste. `marktkarteui.js` hört statt auf `tab-changed` auf das neue `sub-changed`. Der lange Heute-Scroll halbiert sich.

*Stolperfallen:* Bei DOM-Umzügen ganze Blöcke verschieben, nie Elemente neu erzeugen (IDs und Listener!); `test-v6.js` nach jeder Kennung durchsuchen; die Simnote-Texte anpassen, die auf alte Orte verweisen (Positions-Leerzustand nennt „Regeln → Schalter & Einstellungen", der Bestand-Leerzustand nennt „Reiter Heute").

### Stufe D — ein Bausteinkasten statt acht Handgriffe (1–2 Sitzungen)

1. `U.esc` überall; die lokalen `esc()`-Kopien in `scoreboard.js`, `bestandui.js`, `bestand.js` (dort toter Code) löschen. **(B4)**
2. Eine `statuszeile(el, text, art)`-Hilfe in `app-shell.js` (oder `U`); die acht Handgriffe nach und nach umstellen (mechanisch, je Modul ein Commit).
3. Eine `kachel(name, wert, sub)`-Hilfe für `.depot-stats`-Kacheln; `mfdepot.js`/`driftui.js` nutzen sie statt handgebautem Markup mit Inline-`font-size`. **(B4)**
4. Diagnose-Banner auf das `modal-bg`-Muster; `window.confirm` in `mfdepot.js` durch den bestehenden Dialog-Baustein ersetzen. **(B4)**
5. Eine Urteil-Tabelle in `scoreboard.js` (Label, Farbe, Erklärtext je Urteil an einem Ort; `bestaetigt-aber-nullpunkt-verschoben` ergänzen). **(B5)**
6. Erklärsystem: die `title`-Texte der Experten-Einstellungen (`#idParams`) ins Info-Register (`app-shell.js Info`) überführen — je Gruppe ein Info-Knopf (Signal / Risiko & Kosten / Filter & Schutz / Haltedauer), `title` bleibt als Zweitweg stehen. Ziel nicht 0 Tooltips, sondern: **kein Wissen, das nur im Tooltip lebt.** **(B1)**

### Stufe E — depot.js zerlegen (je Block eine Sitzung, mechanisch)

Reihenfolge nach Verflechtungsgrad (locker → fest). Muster je Block: neue Datei als IIFE mit `window.<Name>`, `<script>`-Tag vor `depot.js`, Block in `depot.js` löschen, Aufrufstellen auf `window.<Name>` umstellen, Textmarken in `test-v6.js` auf die neue Datei zeigen lassen.

1. `wendeui.js` — Trendfinder (`wende*` samt eigener Chart-Zeichnung; liest `D` nur).
2. `strategiechart.js` — `stc*`-Familie (eigenes `stcState`; Rückgriff aus der Positionstabelle über eine kleine API `StrategieChart.zeigen(sym)`).
3. `backtestui.js` + `btpool.js` — Backtest-UI und Worker-Pool.
4. `backfill.js` — Massen-Backfill + Datenquellen-Diagnose.
5. `berichte.js` — Retro, Wochenreport, Analyse-Export, Messbericht.
6. `kosten.js` — Kostenrunden/Spannen-Bilanz.
7. `zucht.js` — Tiefensuche/genetische Suche.

Danach, als eigenes Vorhaben: `init()` dritteln (`depotMigration.js` / Verdrahtung / Scheduler) und den Speicher-Nebeneffekt aus `render()` ziehen (`equityHist`-Fortschreibung in den Scheduler). **Nicht anfassen ohne eigenes, abgesprochenes Vorhaben:** `intradayScan()` und der Autopilot-Ring — dort liegen Handel und Anzeige Zeile an Zeile; jede „Aufräum"-Berührung ist ein Handelsrisiko.

### Stufe F — Einzelentscheidungen (je eigenes Vorhaben)

- **Ein Chart-Renderer:** `explorer.js drawBig` auf `chart.js` umstellen (oder `drawBig` extrahieren und `chart.js` einschmelzen — Entscheid nach Funktionsvergleich); Signalfarben aus Hex auf Tokens. Groß, sichtbar, lohnend — aber erst nach Stufe D.
- **Barrierefreiheit systematisch** (Rest von #59 Stufe 3): Tabellen-Semantik im Signal-Monitor/Scoreboard, `aria-live` gezielt statt breit, Fokusreihenfolge in den Modals, Kontrast-Nachmessung der Chips.
- **Theme ohne Blitz:** Thema synchron vor dem ersten Paint setzen (z. B. `main.js` injiziert `data-theme` beim Laden aus dem Store) plus optional „System"-Modus.
- **Nicht empfohlen jetzt:** `data-tab`-Kennungen an Labels angleichen — hohes Bruchrisiko in Tests und Logik bei rein kosmetischem Nutzen. Stattdessen eine Kommentar-Zeile je Reiter in `index.html` („dashboard = Heute").

---

## 5. Leitplanken — was bei jedem Schritt gilt

1. **Messaussagen sind unantastbar.** Belegtexte, Urteile, Zahlen werden verschoben, nie umformuliert oder gekürzt. Widerlegtes bleibt sichtbar (Archiv-Muster), der Belegstand kommt aus Protokollen, nie aus Prosa.
2. **Kein Umbau der Handelslogik unter dem Deckmantel „Struktur".** `SETUPS`, `TRIG_BELEGT`, `modeParams`, Gates, Scan — tabu für alle Stufen dieses Plans.
3. **IDs sind Schnittstellen.** Element-IDs und `data-*`-Werte bleiben bei Umzügen erhalten; ganze DOM-Blöcke verschieben statt neu bauen.
4. **`npm test` grün vor jedem Push** (eslint + test-channel + test-v6); Textmarken-Zusicherungen ziehen mit dem Code um. Eine Zusicherung, die korrektes Verhalten rot malt, wird repariert — nicht das Verhalten.
5. **Parallelbetrieb:** nur eigene Dateien committen, eine Release-Notiz je Vorhaben, Versionen vergibt die Wache. Vor Push `git fetch` und `git ls-remote --heads` (die enge fetch-Refspec, #76.2, ist weiter offen).
6. **Die Oberfläche zeigt das gemessene System ehrlich** — jede Kürzung von Dauertext braucht das Info-Knopf-Einverständnis (Abschnitt 6, Frage 2).

---

## 6. Entscheidungen, die nur Wilhelm treffen kann

1. **Stufe C freigeben?** Insbesondere: Marktkarte als Pille unter Heute (Reiter entfällt) — ja/nein? Und: Mittelfrist-Steuerung nach Regeln, Vermögen wird reine Anzeige — so gewollt?
2. **Info-Knopf-Linie fortsetzen?** Trendfinder-Erklärblock und Experten-`title`-Texte hinter Info-Knöpfe (wie Audit-Stufe 2) — oder bleiben sie Dauertext? (Die Hausregel „Oberfläche zeigt ehrlich" gegen „weniger Wand" — dieselbe Abwägung wie am 23.08.)
3. **Felix' Produktperspektive (#71):** Mehrbenutzer/Bezahlmodell betrifft Datenablage, nicht diese Stufen — aber wenn das ernsthaft kommt, sollte Stufe C die „Meine Papiere"-Pille gleich als künftigen Konto-Bereich denken (ein Ort für alles Persönliche).
4. **Onboarding gestalten?** (P6) Ein geführter Erststart (3 Karten: „Was diese App ist / Was simuliert wird / Wo deine Papiere hinkommen") wäre ein eigenes kleines Vorhaben nach Stufe C.

---

## 7. Nachtrag 25.08. abends: Zusatzkritik, Stand der Umsetzung

Nach dem Plan kamen zwölf weitere Kritikpunkte (Chat mit Wilhelm); die Punkte 3–12 hat er zum Beheben freigegeben, 1–2 (Produkt-Identität, Nachbilden-Ticket) liegen bewusst. Stand am Abend:

| Punkt | Inhalt | Stand |
|---|---|---|
| 3 | Belegaussagen aus den Protokollen statt Prosa | umgesetzt: `PROTOKOLL_KANTE` speist jetzt auch Strategien-Übersicht (`DepotAPI.protokollKante`, Ereignis `kanten-geladen`) und Klartext-Kasten; Code-Fallbacks sind als solche gekennzeichnet |
| 4 | Lebenszyklus einer Regel verbinden | umgesetzt: Scoreboard-Spalte „Im Betrieb" (`DepotAPI.regelStatus`), Regelbuch-Beleg verlinkt aufs Scoreboard |
| 5 | Handel läuft im Renderer | **bewusst nicht angefasst** — Architektur-Umbau, eigenes Vorhaben mit eigenem Auftrag (Leitplanke 2) |
| 6 | Zahlenformate gemischt | umgesetzt: `U.dez` (Komma) in allen sichtbaren Pp-/Prozent-Statuszeilen; CSV/Maschinenlesbares bleibt beim Punkt |
| 7 | Fehlermeldungs-Bereich = Label | umgesetzt: `offenerTab()` liefert Reiter + Pille als Name UND Kennung |
| 8 | Release-Notizen erreichen Anwender nie | umgesetzt: `wasneu.js` + Dialog + Knopf in den Einstellungen; Repo kommt aus `build.publish` via `update-state` |
| 9 | Capital.com an drei Orten | umgesetzt: laufender Status als Spiegel neben den Zugangsdaten (`#setCapStatusLive`) |
| 10 | 15 Werte dreimal auf „Heute" | umgesetzt: Movers-Spalten entfernt, Marktbild sortiert signiert und trägt alles |
| 11 | Muster-Brüche (Pille als Aktion, notify-Checkbox) | umgesetzt: „App-Einstellungen …"-Knopf gestrichelt, Benachrichtigung im Einstellungs-Abschnitt |
| 12 | Verhaltens-Smoke-Test | umgesetzt: `tools/ui-probe.js` (isolierte Instanz, klickt alle Reiter und Pillen, Exit-Code 0/1/2) — gehört einmal vor und einmal nach jedem Navigations-Umbau |

Parallel dazu hat die Aufräum-Sitzung Stufe A, B und Teile von D geliefert (Sammelzeilen, Statuszeilen-Hilfe, Kachel-Hilfe, eine Urteil-Tabelle) und beginnt auf Wilhelms Freigabe **Stufe C** (Mittelfrist → Regeln, Meine Papiere → Vermögen, Marktkarte als Heute-Pille) plus D.6.

*Testartefakte (26 Screenshots Erststart/Hell/Schmal, Testfahrer-Skript) liegen im Sitzungs-Scratchpad und sind bewusst nicht eingecheckt. Die Befunde sind oben vollständig textlich beschrieben; jede bauende Sitzung kann den Zustand mit einer isolierten Instanz (eigenes userData + eigener Downloads-Pfad per `app.setPath`) selbst reproduzieren.*
